-- Make event_date nullable in important_dates table
ALTER TABLE important_dates
  ALTER COLUMN event_date DROP NOT NULL;

-- Add comment
COMMENT ON COLUMN important_dates.event_date IS '일정 날짜 (선택사항)';
