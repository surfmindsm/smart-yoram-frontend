-- Migration: Add view_count to bulletins table
-- This adds view count tracking functionality to the bulletins table

-- Add view_count column with default value of 0
ALTER TABLE public.bulletins
ADD COLUMN view_count INTEGER DEFAULT 0 NOT NULL;

-- Add index for view_count to support sorting by popularity
CREATE INDEX idx_bulletins_view_count ON public.bulletins(view_count);

-- Add comment for documentation
COMMENT ON COLUMN public.bulletins.view_count IS '주보 조회수 (자동으로 증가됨)';
