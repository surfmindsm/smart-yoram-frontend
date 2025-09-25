-- GPT License Management System Migration
-- This creates the database schema for managing GPT licenses per church

-- Step 1: Add GPT license count to churches table
ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS gpt_licenses_purchased INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS gpt_licenses_active INTEGER DEFAULT 0 NOT NULL;

-- Step 2: Create user_gpt_licenses table to track which users have licenses
CREATE TABLE IF NOT EXISTS public.user_gpt_licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id INTEGER NOT NULL REFERENCES public.churches(serial_id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_gpt_licenses_user_id ON public.user_gpt_licenses (user_id);
CREATE INDEX IF NOT EXISTS idx_user_gpt_licenses_church_id ON public.user_gpt_licenses (church_id);
CREATE INDEX IF NOT EXISTS idx_user_gpt_licenses_assigned_by ON public.user_gpt_licenses (assigned_by);

-- Step 4: Create unique constraint to prevent duplicate licenses per user per church
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_church_gpt_license
ON public.user_gpt_licenses (user_id, church_id)
WHERE is_active = true;

-- Step 5: Create RLS policies
ALTER TABLE public.user_gpt_licenses ENABLE ROW LEVEL SECURITY;

-- Policy for system super admin to see all licenses
CREATE POLICY "System super admin can see all GPT licenses" ON public.user_gpt_licenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'super_admin'
  )
);

-- Policy for church super admin to see their church's licenses
CREATE POLICY "Church super admin can manage their church GPT licenses" ON public.user_gpt_licenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
    AND u.role = 'church_super_admin'
    AND u.church_id = church_id
  )
);

-- Policy for users to see their own license
CREATE POLICY "Users can see their own GPT license" ON public.user_gpt_licenses
FOR SELECT USING (user_id = auth.uid());

-- Step 6: Create helper functions

-- Function to get church GPT license stats
CREATE OR REPLACE FUNCTION get_church_gpt_license_stats(target_church_id integer)
RETURNS TABLE (
  church_id integer,
  church_name character varying,
  licenses_purchased integer,
  licenses_active integer,
  licenses_assigned integer,
  licenses_available integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.serial_id,
    c.name,
    c.gpt_licenses_purchased,
    c.gpt_licenses_active,
    COALESCE(COUNT(ugl.id)::integer, 0) as licenses_assigned,
    GREATEST(c.gpt_licenses_purchased - COALESCE(COUNT(ugl.id)::integer, 0), 0) as licenses_available
  FROM public.churches c
  LEFT JOIN public.user_gpt_licenses ugl ON c.serial_id = ugl.church_id AND ugl.is_active = true
  WHERE c.serial_id = target_church_id
  GROUP BY c.serial_id, c.name, c.gpt_licenses_purchased, c.gpt_licenses_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user has GPT license
CREATE OR REPLACE FUNCTION user_has_gpt_license(target_user_id uuid, target_church_id integer DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  has_license boolean := false;
  user_church_id integer;
BEGIN
  -- If church_id not provided, get it from user
  IF target_church_id IS NULL THEN
    SELECT church_id INTO user_church_id FROM public.users WHERE id = target_user_id;
  ELSE
    user_church_id := target_church_id;
  END IF;

  -- Check if user has active license
  SELECT EXISTS(
    SELECT 1 FROM public.user_gpt_licenses
    WHERE user_id = target_user_id
    AND church_id = user_church_id
    AND is_active = true
  ) INTO has_license;

  RETURN has_license;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger to update licenses_active count when licenses are assigned/revoked
CREATE OR REPLACE FUNCTION update_church_gpt_licenses_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    UPDATE public.churches
    SET gpt_licenses_active = gpt_licenses_active + 1
    WHERE serial_id = NEW.church_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active = false AND NEW.is_active = true THEN
      UPDATE public.churches
      SET gpt_licenses_active = gpt_licenses_active + 1
      WHERE serial_id = NEW.church_id;
    ELSIF OLD.is_active = true AND NEW.is_active = false THEN
      UPDATE public.churches
      SET gpt_licenses_active = gpt_licenses_active - 1
      WHERE serial_id = NEW.church_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    UPDATE public.churches
    SET gpt_licenses_active = gpt_licenses_active - 1
    WHERE serial_id = OLD.church_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_church_gpt_licenses_count
  AFTER INSERT OR UPDATE OR DELETE ON public.user_gpt_licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_church_gpt_licenses_count();

-- Step 8: Initialize existing churches with 0 licenses
UPDATE public.churches
SET gpt_licenses_purchased = 0, gpt_licenses_active = 0
WHERE gpt_licenses_purchased IS NULL OR gpt_licenses_active IS NULL;

-- Step 9: Add some sample data for testing (optional)
-- INSERT INTO public.user_gpt_licenses (user_id, church_id, assigned_by, is_active) VALUES
-- ((SELECT id FROM auth.users WHERE email = 'test@example.com'), 1, (SELECT id FROM auth.users WHERE email = 'admin@example.com'), true)
-- ON CONFLICT DO NOTHING;

-- Verify the migration
SELECT
  c.serial_id,
  c.name,
  c.gpt_licenses_purchased,
  c.gpt_licenses_active,
  COUNT(ugl.id) as assigned_licenses
FROM public.churches c
LEFT JOIN public.user_gpt_licenses ugl ON c.serial_id = ugl.church_id AND ugl.is_active = true
GROUP BY c.serial_id, c.name, c.gpt_licenses_purchased, c.gpt_licenses_active
ORDER BY c.serial_id;