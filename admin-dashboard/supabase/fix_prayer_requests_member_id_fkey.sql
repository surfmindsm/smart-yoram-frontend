-- Fix foreign key constraint for prayer_requests.member_id
-- Change from users table to members table

-- 1. Drop the existing foreign key constraint
ALTER TABLE public.prayer_requests
DROP CONSTRAINT IF EXISTS prayer_requests_member_id_fkey;

-- 2. Add new foreign key constraint referencing members table
ALTER TABLE public.prayer_requests
ADD CONSTRAINT prayer_requests_member_id_fkey
FOREIGN KEY (member_id)
REFERENCES public.members(id)
ON DELETE SET NULL;

-- 3. Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_prayer_requests_member_id ON public.prayer_requests(member_id);

-- 4. Add comment
COMMENT ON COLUMN public.prayer_requests.member_id IS 'Foreign key to members table (not users)';
