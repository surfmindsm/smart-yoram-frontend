-- Fix RLS Policies for Church Organizations
-- This SQL fixes the Row Level Security policies to allow authenticated users to manage organizations

-- 1. First, drop existing policies
DROP POLICY IF EXISTS "Allow authenticated access to church_organizations" ON public.church_organizations;
DROP POLICY IF EXISTS "Allow authenticated access to member_organizations" ON public.member_organizations;
DROP POLICY IF EXISTS "Allow authenticated access to organization_activities" ON public.organization_activities;

-- 2. Create more permissive policies for development
-- Note: In production, you should restrict these based on user roles and church_id

-- Church Organizations policies
CREATE POLICY "Enable read access for all users" ON public.church_organizations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.church_organizations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.church_organizations
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.church_organizations
    FOR DELETE USING (true);

-- Member Organizations policies
CREATE POLICY "Enable read access for all users" ON public.member_organizations
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.member_organizations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.member_organizations
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.member_organizations
    FOR DELETE USING (true);

-- Organization Activities policies
CREATE POLICY "Enable read access for all users" ON public.organization_activities
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.organization_activities
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.organization_activities
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON public.organization_activities
    FOR DELETE USING (true);

-- Alternative: If you want to completely disable RLS for testing (NOT recommended for production)
-- ALTER TABLE public.church_organizations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.member_organizations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.organization_activities DISABLE ROW LEVEL SECURITY;