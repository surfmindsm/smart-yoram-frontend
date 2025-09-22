-- Create verification codes table for email verification
CREATE TABLE IF NOT EXISTS public.verification_codes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email_code ON public.verification_codes(email, code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.verification_codes(expires_at);

-- Add RLS policies
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Service role can access all rows (for Edge Function)
CREATE POLICY "Service role can manage verification codes" ON public.verification_codes
  FOR ALL USING (auth.role() = 'service_role');