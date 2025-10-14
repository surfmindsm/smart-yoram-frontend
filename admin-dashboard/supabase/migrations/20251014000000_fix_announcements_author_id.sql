-- Fix announcements table author_id constraint
-- Remove NOT NULL constraint and remove foreign key if exists

-- First, drop the foreign key constraint if it exists
ALTER TABLE public.announcements
DROP CONSTRAINT IF EXISTS announcements_author_id_fkey;

-- Change author_id to allow NULL values
ALTER TABLE public.announcements
ALTER COLUMN author_id DROP NOT NULL;

-- Set a default value for existing rows
UPDATE public.announcements
SET author_id = NULL
WHERE author_id IS NOT NULL AND author_id NOT IN (SELECT id FROM public.users);

-- Comment explaining the change
COMMENT ON COLUMN public.announcements.author_id IS 'Optional reference to users table. Can be NULL if author is not a registered user.';
