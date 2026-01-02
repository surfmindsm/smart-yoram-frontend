-- Create member_children table for storing children information
-- 교인 자녀 정보를 저장하는 테이블 생성

CREATE TABLE IF NOT EXISTS public.member_children (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    birthdate DATE,
    birthdate_type VARCHAR(10) DEFAULT '양력',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_member_children_member_id ON public.member_children(member_id);
CREATE INDEX IF NOT EXISTS idx_member_children_name ON public.member_children(name);

-- Add comments
COMMENT ON TABLE public.member_children IS '교인 자녀 정보';
COMMENT ON COLUMN public.member_children.member_id IS '교인 ID (외래키)';
COMMENT ON COLUMN public.member_children.name IS '자녀 이름';
COMMENT ON COLUMN public.member_children.gender IS '성별 (남/여)';
COMMENT ON COLUMN public.member_children.birthdate IS '생년월일';
COMMENT ON COLUMN public.member_children.birthdate_type IS '생년월일 구분 (양력/음력)';
COMMENT ON COLUMN public.member_children.notes IS '비고 (특이사항 등)';

-- Enable Row Level Security
ALTER TABLE public.member_children ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read all member children
CREATE POLICY "Authenticated users can read member children" ON public.member_children
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert member children
CREATE POLICY "Authenticated users can insert member children" ON public.member_children
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update member children
CREATE POLICY "Authenticated users can update member children" ON public.member_children
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete member children
CREATE POLICY "Authenticated users can delete member children" ON public.member_children
    FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger for automatic timestamp updates
CREATE TRIGGER handle_updated_at_member_children
    BEFORE UPDATE ON public.member_children
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
