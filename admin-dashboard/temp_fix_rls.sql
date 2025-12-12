-- Temporary fix for member_organizations RLS policy
-- This allows all access to member_organizations table

DROP POLICY IF EXISTS "Allow authenticated access to member_organizations" ON public.member_organizations;

CREATE POLICY "Allow all access to member_organizations" ON public.member_organizations
    FOR ALL USING (true);
