-- Create departments table for managing church departments
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id INTEGER NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_department_name_per_church UNIQUE(church_id, name)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_departments_church_id ON public.departments(church_id);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON public.departments(is_active);

-- Add comments for documentation
COMMENT ON TABLE public.departments IS '교회 부서 관리 테이블';
COMMENT ON COLUMN public.departments.church_id IS '교회 ID';
COMMENT ON COLUMN public.departments.name IS '부서명';
COMMENT ON COLUMN public.departments.description IS '부서 설명';
COMMENT ON COLUMN public.departments.is_active IS '활성화 여부';
COMMENT ON COLUMN public.departments.display_order IS '표시 순서';
