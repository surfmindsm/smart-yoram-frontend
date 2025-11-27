-- Remove event_type column from important_dates table
-- 일정 유형(event_type) 컬럼 제거

-- Drop the event_type column
ALTER TABLE public.important_dates DROP COLUMN IF EXISTS event_type;

-- Drop the event_type index if it exists
DROP INDEX IF EXISTS idx_important_dates_event_type;
