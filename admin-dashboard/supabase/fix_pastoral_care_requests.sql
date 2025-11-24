-- Fix pastoral_care_requests table

-- 1. Delete all existing data
DELETE FROM public.pastoral_care_requests;

-- 2. Drop existing foreign key constraint if exists
ALTER TABLE public.pastoral_care_requests
DROP CONSTRAINT IF EXISTS pastoral_care_requests_member_id_fkey;

-- 3. Add new foreign key constraint referencing members table
ALTER TABLE public.pastoral_care_requests
ADD CONSTRAINT pastoral_care_requests_member_id_fkey
FOREIGN KEY (member_id)
REFERENCES public.members(id)
ON DELETE SET NULL;

-- 4. Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_pastoral_care_requests_member_id ON public.pastoral_care_requests(member_id);

-- 5. Add comment
COMMENT ON COLUMN public.pastoral_care_requests.member_id IS 'Foreign key to members table (not users)';
