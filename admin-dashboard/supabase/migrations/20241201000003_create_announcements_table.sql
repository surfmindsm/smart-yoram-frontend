-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id BIGSERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER,
    author_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    target_audience VARCHAR(50),
    category VARCHAR(50),
    subcategory VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_announcements_church_id ON public.announcements(church_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON public.announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON public.announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON public.announcements(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.announcements
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.announcements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public.announcements
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users only" ON public.announcements
    FOR DELETE USING (true);

-- Insert sample data for church_id 6 (remove author_id to avoid foreign key constraint)
INSERT INTO public.announcements (church_id, title, content, author_name, is_active, is_pinned, target_audience, category)
VALUES
    (6, '주일 예배 시간 변경 안내', '오는 12월부터 주일 1부 예배가 오전 9시로 변경됩니다. 교인 여러분께서는 착오 없으시기 바랍니다.', '관리자', true, true, 'all', 'worship'),
    (6, '성탄절 특별 행사 안내', '12월 25일 성탄절을 맞아 특별 행사를 준비했습니다. 많은 참여 부탁드립니다.', '관리자', true, false, 'all', 'event'),
    (6, '새해 금식 기도회', '2025년 새해를 맞아 금식 기도회를 개최합니다. 함께 기도해요.', '관리자', true, false, 'all', 'worship')
ON CONFLICT DO NOTHING;