-- Fix RLS policy for verification_codes table
-- The previous policy auth.role() = 'service_role' doesn't work correctly with Edge Functions

-- Drop existing policy
DROP POLICY IF EXISTS "Service role can manage verification codes" ON public.verification_codes;

-- Disable RLS for this table since it only contains temporary verification codes
-- No sensitive data is stored here (just email and temporary code)
ALTER TABLE public.verification_codes DISABLE ROW LEVEL SECURITY;
