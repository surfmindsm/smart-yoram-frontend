-- Remove default value from is_free column
-- This ensures the application explicitly sets the value (true or false)
ALTER TABLE community_sharing
ALTER COLUMN is_free DROP DEFAULT;

-- Make is_free NOT NULL to ensure it's always explicitly set
ALTER TABLE community_sharing
ALTER COLUMN is_free SET NOT NULL;
