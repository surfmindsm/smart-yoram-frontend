-- Add 'active' status to invitation_status enum
-- This allows tracking when a member has completed their first login and password change

-- First, drop the existing constraint
ALTER TABLE public.members DROP CONSTRAINT IF EXISTS members_invitation_status_check;

-- Add new constraint with 'active' status
ALTER TABLE public.members ADD CONSTRAINT members_invitation_status_check
  CHECK (invitation_status IN ('pending', 'sent', 'failed', 'active'));

-- Update comment for documentation
COMMENT ON COLUMN public.members.invitation_status IS '초대 상태: pending(대기), sent(발송완료), failed(발송실패), active(활성화-첫 로그인 완료)';
