-- Add homepage_url and youtube_channel columns to churches table
ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS homepage_url character varying,
ADD COLUMN IF NOT EXISTS youtube_channel character varying;

-- Add comments for documentation
COMMENT ON COLUMN public.churches.homepage_url IS 'Church official homepage URL';
COMMENT ON COLUMN public.churches.youtube_channel IS 'Church official YouTube channel URL';
