-- Add birthdate_type column to members table for lunar/solar calendar distinction
-- 교인 생년월일 양력/음력 구분 필드 추가

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS birthdate_type VARCHAR(20) DEFAULT '양력';

-- Add comment
COMMENT ON COLUMN public.members.birthdate_type IS '생년월일 구분 (양력/음력)';

-- Add index for potential filtering
CREATE INDEX IF NOT EXISTS idx_members_birthdate_type ON public.members(birthdate_type);
