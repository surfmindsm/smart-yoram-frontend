-- Add invitation tracking fields to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS invitation_status TEXT DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'sent', 'failed'));
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS temporary_password TEXT;

-- Add index for invitation status queries
CREATE INDEX IF NOT EXISTS idx_members_invitation_status ON public.members(invitation_status);

-- Add comment for documentation
COMMENT ON COLUMN public.members.invited_at IS 'SMS 초대 발송 시간';
COMMENT ON COLUMN public.members.invitation_status IS '초대 상태: pending(대기), sent(발송완료), failed(발송실패)';
COMMENT ON COLUMN public.members.temporary_password IS '임시 비밀번호 (초대 시 생성)';