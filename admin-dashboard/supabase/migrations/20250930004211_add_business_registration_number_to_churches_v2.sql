-- Add business_registration_number column to churches table if it doesn't exist
ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS business_registration_number VARCHAR(20);

-- Add comment for clarity
COMMENT ON COLUMN public.churches.business_registration_number IS '¨≈êÒ]à8 (0Äù â©)';