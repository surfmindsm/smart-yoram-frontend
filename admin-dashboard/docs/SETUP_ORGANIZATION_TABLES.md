# 교회 조직 관리 테이블 설정 가이드

## 📌 Supabase SQL Editor에서 직접 실행하기

조직 관리 기능을 사용하려면 다음 SQL을 Supabase Dashboard의 SQL Editor에서 실행해야 합니다.

### 1. Supabase Dashboard 접속
1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 해당 프로젝트 선택
3. 좌측 메뉴에서 **SQL Editor** 클릭

### 2. 다음 SQL 실행

```sql
-- Church Organization Management System
-- This migration creates tables for managing church organizational units (districts, groups, etc.)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Church Organizations table - main organizations/districts/groups within a church
CREATE TABLE IF NOT EXISTS public.church_organizations (
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
CREATE TABLE IF NOT EXISTS public.member_organizations (
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
CREATE TABLE IF NOT EXISTS public.organization_activities (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_church_organizations_church_id ON public.church_organizations(church_id);
CREATE INDEX IF NOT EXISTS idx_church_organizations_parent_id ON public.church_organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_church_organizations_type ON public.church_organizations(organization_type);
CREATE INDEX IF NOT EXISTS idx_church_organizations_active ON public.church_organizations(is_active);

CREATE INDEX IF NOT EXISTS idx_member_organizations_member_id ON public.member_organizations(member_id);
CREATE INDEX IF NOT EXISTS idx_member_organizations_organization_id ON public.member_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_member_organizations_active ON public.member_organizations(is_active);

CREATE INDEX IF NOT EXISTS idx_organization_activities_organization_id ON public.organization_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_activities_date ON public.organization_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_organization_activities_type ON public.organization_activities(activity_type);

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

-- Create trigger if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_organization_member_count') THEN
        CREATE TRIGGER trigger_update_organization_member_count
            AFTER INSERT OR UPDATE OR DELETE ON public.member_organizations
            FOR EACH ROW EXECUTE FUNCTION update_organization_member_count();
    END IF;
END
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_church_organizations_updated_at') THEN
        CREATE TRIGGER trigger_church_organizations_updated_at
            BEFORE UPDATE ON public.church_organizations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_member_organizations_updated_at') THEN
        CREATE TRIGGER trigger_member_organizations_updated_at
            BEFORE UPDATE ON public.member_organizations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_organization_activities_updated_at') THEN
        CREATE TRIGGER trigger_organization_activities_updated_at
            BEFORE UPDATE ON public.organization_activities
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Row Level Security (RLS) policies
ALTER TABLE public.church_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_activities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated access to church_organizations" ON public.church_organizations;
DROP POLICY IF EXISTS "Allow authenticated access to member_organizations" ON public.member_organizations;
DROP POLICY IF EXISTS "Allow authenticated access to organization_activities" ON public.organization_activities;

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
```

### 3. 실행 확인
SQL 실행 후 다음을 확인:
- ✅ 테이블 생성: `church_organizations`, `member_organizations`, `organization_activities`
- ✅ 인덱스 생성
- ✅ 트리거 생성
- ✅ RLS 정책 적용

### 4. 테스트 데이터 추가 (선택사항)

```sql
-- 샘플 조직 데이터 추가
INSERT INTO public.church_organizations (church_id, name, description, organization_type, level, is_active)
VALUES
    (1, '1구역', '교회 1구역입니다', 'district', 1, true),
    (1, '2구역', '교회 2구역입니다', 'district', 1, true),
    (1, '청년부', '청년 사역팀입니다', 'ministry_team', 1, true);
```

### 5. 페이지 새로고침
브라우저에서 조직 관리 페이지(`/organization-management`)를 새로고침하면 정상적으로 작동합니다.

## 🚨 문제 해결

### 테이블이 이미 존재한다는 에러가 나올 경우
위 SQL의 `CREATE TABLE` 부분을 `CREATE TABLE IF NOT EXISTS`로 변경되어 있으므로 에러가 발생하지 않습니다.

### 권한 문제가 발생할 경우
RLS(Row Level Security) 정책이 적용되어 있습니다. 인증된 사용자만 접근 가능합니다.

### 조직이 표시되지 않을 경우
1. church_id가 올바른지 확인 (현재 코드에서는 1로 하드코딩됨)
2. is_active가 true인지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

## 📝 추가 기능

조직 관리 시스템이 설정되면 다음 기능을 사용할 수 있습니다:
- 계층적 조직 구조 생성 (구역 > 소구역 > 셀그룹)
- 교인을 조직에 배정
- 조직별 리더 지정
- 조직 활동 기록
- 실시간 인원수 통계