-- Daily Verses table
-- Stores daily Bible verses for the church community

CREATE TABLE IF NOT EXISTS public.daily_verses (
    id BIGSERIAL PRIMARY KEY,
    verse TEXT NOT NULL,
    reference VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries on active verses
CREATE INDEX IF NOT EXISTS idx_daily_verses_is_active ON public.daily_verses(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_verses_created_at ON public.daily_verses(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_verses
-- Anyone can read daily verses
CREATE POLICY "Anyone can read daily verses"
    ON public.daily_verses
    FOR SELECT
    USING (true);

-- Only authenticated users can insert daily verses
CREATE POLICY "Authenticated users can insert daily verses"
    ON public.daily_verses
    FOR INSERT
    WITH CHECK (true);

-- Only authenticated users can update daily verses
CREATE POLICY "Authenticated users can update daily verses"
    ON public.daily_verses
    FOR UPDATE
    USING (true);

-- Only authenticated users can delete daily verses
CREATE POLICY "Authenticated users can delete daily verses"
    ON public.daily_verses
    FOR DELETE
    USING (true);

-- Add comment to table
COMMENT ON TABLE public.daily_verses IS '매일 공유되는 성경 말씀을 저장하는 테이블';
COMMENT ON COLUMN public.daily_verses.verse IS '성경 구절 내용';
COMMENT ON COLUMN public.daily_verses.reference IS '성경 구절 출처 (예: 요한복음 3:16)';
COMMENT ON COLUMN public.daily_verses.is_active IS '현재 활성화된 말씀 여부';
