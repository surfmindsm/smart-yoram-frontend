-- Migration to update existing user roles to new 5-tier role system
-- Date: 2025-09-22 13:00:00

-- Update existing roles to new role system
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  CASE
    WHEN raw_user_meta_data->>'role' = 'system_admin' THEN '"super_admin"'
    WHEN raw_user_meta_data->>'role' = 'admin' THEN '"church_admin"'
    WHEN raw_user_meta_data->>'role' = 'community_user' THEN '"community_admin"'
    WHEN raw_user_meta_data->>'role' = 'member' THEN '"member"'
    WHEN raw_user_meta_data->>'role' = 'church_admin' THEN '"church_admin"'
    ELSE '"member"'  -- Default fallback
  END::jsonb
)
WHERE raw_user_meta_data->>'role' IS NOT NULL;

-- Update users who don't have a role assigned (set to member by default)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"member"'::jsonb
)
WHERE raw_user_meta_data->>'role' IS NULL;

-- Special case: Promote church_id = 0 users to super_admin
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'),
  '{role}',
  '"super_admin"'::jsonb
)
WHERE (raw_user_meta_data->>'church_id')::integer = 0;

-- For any legacy users table (if exists), update roles there too
UPDATE users
SET role = CASE
  WHEN role = 'system_admin' THEN 'super_admin'
  WHEN role = 'admin' THEN 'church_admin'
  WHEN role = 'community_user' THEN 'community_admin'
  WHEN role = 'member' THEN 'member'
  WHEN role = 'church_admin' THEN 'church_admin'
  ELSE 'member'
END
WHERE role IS NOT NULL;

-- Set default role for users without role in legacy users table
UPDATE users
SET role = 'member'
WHERE role IS NULL;

-- Promote church_id = 0 users to super_admin in legacy users table
UPDATE users
SET role = 'super_admin'
WHERE church_id = 0;