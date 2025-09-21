-- Create verification_codes table for email verification
CREATE TABLE verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_verification_codes_email_code ON verification_codes(email, code);
CREATE INDEX idx_verification_codes_expires_at ON verification_codes(expires_at);

-- Enable Row Level Security
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert verification codes
CREATE POLICY "Allow verification code insertion" ON verification_codes
FOR INSERT WITH CHECK (true);

-- Create policy to allow verification code lookups
CREATE POLICY "Allow verification code lookup" ON verification_codes
FOR SELECT USING (true);

-- Create policy to allow verification code deletion
CREATE POLICY "Allow verification code deletion" ON verification_codes
FOR DELETE USING (true);

-- Automatically clean up expired codes (optional)
-- This function can be called periodically to clean up expired codes
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;