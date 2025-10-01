-- Church Organization Management System
-- This migration creates tables for managing church organizational units (districts, groups, etc.)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Church Organizations table - main organizations/districts/groups within a church
CREATE TABLE public.church_organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    church_id INTEGER NOT NULL, -- Reference to legacy church ID
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_type VARCHAR(50) NOT NULL CHECK (organization_type IN ('district', 'sub_district', 'cell_group', 'ministry_team', 'custom')),
    parent_id UUID REFERENCES public.church_organizations(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 1 CHECK (level > 0), -- Hierarchy level (1: top level, 2: sub level, etc.)
    sort_order INTEGER DEFAULT 0,
    leader_id INTEGER, -- Leader member ID (reference to legacy members table)
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    meeting_schedule TEXT,
    meeting_location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    member_count INTEGER DEFAULT 0, -- Computed field for current member count
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(church_id, name), -- Organization names must be unique within a church
    CHECK (parent_id != id) -- Organization cannot be parent of itself
);

-- 2. Member Organizations relationship table - manages member assignments to organizations
CREATE TABLE public.member_organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    member_id INTEGER NOT NULL, -- Reference to legacy members table ID
    organization_id UUID REFERENCES public.church_organizations(id) ON DELETE CASCADE,
    role VARCHAR(100) DEFAULT 'member' CHECK (role IN ('leader', 'sub_leader', 'member')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by INTEGER, -- Admin who made the assignment (legacy member ID)
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    UNIQUE(member_id, organization_id) -- A member can only be assigned once to each organization
);

-- 3. Organization Activities table - tracks organization activities and events
CREATE TABLE public.organization_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.church_organizations(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL CHECK (activity_type IN ('meeting', 'event', 'service', 'training', 'outreach', 'fellowship')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    attendee_count INTEGER DEFAULT 0 CHECK (attendee_count >= 0),
    notes TEXT,
    created_by INTEGER, -- Creator member ID (legacy member ID)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_church_organizations_church_id ON public.church_organizations(church_id);
CREATE INDEX idx_church_organizations_parent_id ON public.church_organizations(parent_id);
CREATE INDEX idx_church_organizations_type ON public.church_organizations(organization_type);
CREATE INDEX idx_church_organizations_active ON public.church_organizations(is_active);

CREATE INDEX idx_member_organizations_member_id ON public.member_organizations(member_id);
CREATE INDEX idx_member_organizations_organization_id ON public.member_organizations(organization_id);
CREATE INDEX idx_member_organizations_active ON public.member_organizations(is_active);

CREATE INDEX idx_organization_activities_organization_id ON public.organization_activities(organization_id);
CREATE INDEX idx_organization_activities_date ON public.organization_activities(activity_date);
CREATE INDEX idx_organization_activities_type ON public.organization_activities(activity_type);

-- Function to update member count when members are added/removed from organizations
CREATE OR REPLACE FUNCTION update_organization_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update count for the organization
        UPDATE public.church_organizations
        SET member_count = (
            SELECT COUNT(*)
            FROM public.member_organizations
            WHERE organization_id = NEW.organization_id AND is_active = true
        ),
        updated_at = NOW()
        WHERE id = NEW.organization_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update count for the organization
        UPDATE public.church_organizations
        SET member_count = (
            SELECT COUNT(*)
            FROM public.member_organizations
            WHERE organization_id = OLD.organization_id AND is_active = true
        ),
        updated_at = NOW()
        WHERE id = OLD.organization_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update member count
CREATE TRIGGER trigger_update_organization_member_count
    AFTER INSERT OR UPDATE OR DELETE ON public.member_organizations
    FOR EACH ROW EXECUTE FUNCTION update_organization_member_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER trigger_church_organizations_updated_at
    BEFORE UPDATE ON public.church_organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_member_organizations_updated_at
    BEFORE UPDATE ON public.member_organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_organization_activities_updated_at
    BEFORE UPDATE ON public.organization_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE public.church_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies - Allow access for authenticated users (will be refined based on role system)
CREATE POLICY "Allow authenticated access to church_organizations" ON public.church_organizations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to member_organizations" ON public.member_organizations
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated access to organization_activities" ON public.organization_activities
    FOR ALL USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE public.church_organizations IS '교회 조직 단위 관리 (구역, 소구역, 셀그룹, 사역팀 등)';
COMMENT ON TABLE public.member_organizations IS '교인-조직 배정 관계 테이블';
COMMENT ON TABLE public.organization_activities IS '조직별 활동 및 이벤트 기록';

COMMENT ON COLUMN public.church_organizations.organization_type IS '조직 유형: district(구역), sub_district(소구역), cell_group(셀그룹), ministry_team(사역팀), custom(사용자정의)';
COMMENT ON COLUMN public.church_organizations.level IS '조직 계층 레벨 (1: 최상위, 2: 하위 등)';
COMMENT ON COLUMN public.church_organizations.member_count IS '현재 소속 활성 인원수 (자동 계산)';

COMMENT ON COLUMN public.member_organizations.role IS '조직 내 역할: leader(리더), sub_leader(부리더), member(일반 멤버)';
COMMENT ON COLUMN public.member_organizations.assigned_by IS '배정한 관리자 ID';

COMMENT ON COLUMN public.organization_activities.activity_type IS '활동 유형: meeting(모임), event(이벤트), service(예배), training(훈련), outreach(전도), fellowship(친교)';