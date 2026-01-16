-- Migrate 'general' category to 'event' in announcements table
-- This migration updates all announcements with category='general' to category='event'

-- Update announcements table
UPDATE announcements
SET category = 'event'
WHERE category = 'general';

-- Add comment for documentation
COMMENT ON COLUMN announcements.category IS 'Announcement category: worship (예배/모임), member_news (교우 소식), event (행사/공지). The general category has been migrated to event.';
