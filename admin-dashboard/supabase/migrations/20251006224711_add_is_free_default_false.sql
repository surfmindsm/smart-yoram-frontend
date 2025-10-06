-- Add default false to is_free column
-- This ensures items default to non-free (paid items)
-- The application will explicitly set is_free=true for free sharing items
ALTER TABLE community_sharing
ALTER COLUMN is_free SET DEFAULT false;
