-- Auto-update invitation_status to 'active' when user_id is set
-- This ensures consistency when a member successfully logs in and gets connected to a user account

-- Create function to auto-update invitation_status
CREATE OR REPLACE FUNCTION update_invitation_status_on_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If user_id is being set to a non-null value (user_id is integer type)
  IF NEW.user_id IS NOT NULL THEN
    -- Automatically set invitation_status to 'active'
    NEW.invitation_status := 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on members table
DROP TRIGGER IF EXISTS trigger_update_invitation_status ON public.members;

CREATE TRIGGER trigger_update_invitation_status
  BEFORE INSERT OR UPDATE OF user_id
  ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION update_invitation_status_on_user_id();

-- Update existing records: set invitation_status to 'active' for members with user_id
UPDATE public.members
SET invitation_status = 'active'
WHERE user_id IS NOT NULL
  AND invitation_status != 'active';

-- Add comment for documentation
COMMENT ON FUNCTION update_invitation_status_on_user_id() IS 'user_id가 설정되면 자동으로 invitation_status를 active로 변경';
COMMENT ON TRIGGER trigger_update_invitation_status ON public.members IS 'user_id 변경 시 invitation_status를 active로 자동 업데이트';
