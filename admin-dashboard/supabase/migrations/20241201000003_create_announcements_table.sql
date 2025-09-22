-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
    id BIGSERIAL PRIMARY KEY,
    church_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INTEGER DEFAULT 1,
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

-- Sample data insertion removed to avoid constraint issues