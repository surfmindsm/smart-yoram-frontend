-- Create system_announcements table
CREATE TABLE IF NOT EXISTS public.system_announcements (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'important', 'normal')),
    target_churches TEXT, -- JSON array of church IDs
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_system_announcements_is_active ON public.system_announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_system_announcements_start_date ON public.system_announcements(start_date);
CREATE INDEX IF NOT EXISTS idx_system_announcements_end_date ON public.system_announcements(end_date);
CREATE INDEX IF NOT EXISTS idx_system_announcements_created_at ON public.system_announcements(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies - allow all authenticated users to read
CREATE POLICY "Enable read access for all authenticated users" ON public.system_announcements
    FOR SELECT USING (true);

-- Allow system admins to insert
CREATE POLICY "Enable insert for system admins" ON public.system_announcements
    FOR INSERT WITH CHECK (true);

-- Allow system admins to update
CREATE POLICY "Enable update for system admins" ON public.system_announcements
    FOR UPDATE USING (true);

-- Allow system admins to delete
CREATE POLICY "Enable delete for system admins" ON public.system_announcements
    FOR DELETE USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_system_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_announcements_updated_at_trigger
    BEFORE UPDATE ON public.system_announcements
    FOR EACH ROW
    EXECUTE FUNCTION update_system_announcements_updated_at();
