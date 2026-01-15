-- Add view_count column to announcements table
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;

-- Add comment to column
COMMENT ON COLUMN public.announcements.view_count IS '공지사항 조회수';

-- Create index for view_count for better performance when sorting by views
CREATE INDEX IF NOT EXISTS idx_announcements_view_count ON public.announcements(view_count DESC);
