-- Safe migration to add GPT license columns to churches table
-- This migration adds the required columns for GPT license management

-- Add GPT license columns to churches table
ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS gpt_licenses_purchased INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS gpt_licenses_active INTEGER DEFAULT 0 NOT NULL;

-- Create user_gpt_licenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_gpt_licenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  church_id INTEGER NOT NULL REFERENCES public.churches(serial_id) ON DELETE CASCADE,
  assigned_by INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_gpt_licenses_user_id ON public.user_gpt_licenses (user_id);
CREATE INDEX IF NOT EXISTS idx_user_gpt_licenses_church_id ON public.user_gpt_licenses (church_id);
CREATE INDEX IF NOT EXISTS idx_user_gpt_licenses_assigned_by ON public.user_gpt_licenses (assigned_by);

-- Create unique constraint to prevent duplicate licenses per user per church
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_church_gpt_license
ON public.user_gpt_licenses (user_id, church_id)
WHERE is_active = true;

-- Enable RLS on user_gpt_licenses
ALTER TABLE public.user_gpt_licenses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "System super admin can see all GPT licenses" ON public.user_gpt_licenses;
DROP POLICY IF EXISTS "Church super admin can manage their church GPT licenses" ON public.user_gpt_licenses;
DROP POLICY IF EXISTS "Users can see their own GPT license" ON public.user_gpt_licenses;

-- Policy for system super admin to see all licenses
CREATE POLICY "System super admin can see all GPT licenses" ON public.user_gpt_licenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()::integer AND u.role = 'super_admin'
  )
);

-- Policy for church super admin to see their church's licenses
CREATE POLICY "Church super admin can manage their church GPT licenses" ON public.user_gpt_licenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()::integer
    AND u.role = 'church_super_admin'
    AND u.church_id = church_id
  )
);

-- Policy for users to see their own license
CREATE POLICY "Users can see their own GPT license" ON public.user_gpt_licenses
FOR SELECT USING (user_id = auth.uid()::integer);

-- Initialize existing churches with 0 licenses if columns are null
UPDATE public.churches
SET gpt_licenses_purchased = 0, gpt_licenses_active = 0
WHERE gpt_licenses_purchased IS NULL OR gpt_licenses_active IS NULL;