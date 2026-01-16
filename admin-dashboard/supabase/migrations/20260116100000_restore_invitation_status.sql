-- Restore invitation_status to correct values based on temporary_password
-- Fix the issue where all members with user_id were set to 'active'

-- Strategy:
-- 1. No temporary_password → 'pending' (never invited)
-- 2. Has temporary_password + users.is_first = false → 'active' (logged in)
-- 3. Has temporary_password + users.is_first = true → 'sent' (invited but not logged in)

-- Step 1: Set to 'pending' for members who were never invited (no temporary_password)
UPDATE public.members
SET invitation_status = 'pending'
WHERE temporary_password IS NULL
  OR TRIM(temporary_password) = '';

-- Step 2: Set to 'sent' for members with temporary_password but haven't logged in yet
-- (temporary_password 있음 + is_first = true)
UPDATE public.members m
SET invitation_status = 'sent'
FROM public.users u
WHERE m.user_id = u.id
  AND m.temporary_password IS NOT NULL
  AND TRIM(m.temporary_password) != '';

-- Step 2-1: Also set to 'sent' for members with temporary_password but no user_id
-- (초대 발송했지만 user 생성 실패한 케이스)
UPDATE public.members
SET invitation_status = 'sent'
WHERE temporary_password IS NOT NULL
  AND TRIM(temporary_password) != ''
  AND (user_id IS NULL OR user_id::text = '');

-- Step 3: Set to 'active' for members who have actually logged in
-- (temporary_password 있음 + is_first = false)
UPDATE public.members m
SET invitation_status = 'active'
FROM public.users u
WHERE m.user_id = u.id
  AND u.is_first = false  -- Already logged in
  AND m.temporary_password IS NOT NULL
  AND TRIM(m.temporary_password) != '';

-- Log the results
DO $$
DECLARE
  pending_count INTEGER;
  sent_count INTEGER;
  active_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO pending_count FROM public.members WHERE invitation_status = 'pending';
  SELECT COUNT(*) INTO sent_count FROM public.members WHERE invitation_status = 'sent';
  SELECT COUNT(*) INTO active_count FROM public.members WHERE invitation_status = 'active';

  RAISE NOTICE 'Invitation status restored:';
  RAISE NOTICE '  - Pending (never invited): %', pending_count;
  RAISE NOTICE '  - Sent (invited but not logged in): %', sent_count;
  RAISE NOTICE '  - Active (logged in): %', active_count;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.members.invitation_status IS 'Invitation status based on temporary_password:
- pending: no temporary_password (never invited)
- sent: has temporary_password but user has not logged in yet
- active: has temporary_password and user has successfully logged in
- failed: invitation sending failed

Note: temporary_password is set when invitation is sent, invitation_status becomes active only after first login';
