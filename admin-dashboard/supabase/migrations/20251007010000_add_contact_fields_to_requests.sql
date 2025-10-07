-- Add contact_phone and contact_email fields to community_requests table
ALTER TABLE public.community_requests
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100);

COMMENT ON COLUMN public.community_requests.contact_phone IS '연락처 전화번호';
COMMENT ON COLUMN public.community_requests.contact_email IS '연락처 이메일';
