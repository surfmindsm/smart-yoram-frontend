-- Update existing user roles to new 5-tier system
-- Run this in Supabase SQL editor

-- 1. Update system_admin to super_admin
UPDATE users
SET role = 'super_admin'
WHERE role = 'system_admin';

-- 2. Update admin to church_admin
UPDATE users
SET role = 'church_admin'
WHERE role = 'admin';

-- 3. Update community_user to community_admin
UPDATE users
SET role = 'community_admin'
WHERE role = 'community_user';

-- 4. Special case: Force church_id=0 users to super_admin (overrides previous updates)
UPDATE users
SET role = 'super_admin'
WHERE church_id = 0;

-- 5. Ensure members without role are set to member
UPDATE users
SET role = 'member'
WHERE role IS NULL;

-- Check results
SELECT
    email,
    full_name,
    church_id,
    role,
    CASE
        WHEN church_id = 0 THEN 'Super Admin (System)'
        WHEN role = 'super_admin' THEN 'Super Admin'
        WHEN role = 'church_super_admin' THEN 'Church Super Admin'
        WHEN role = 'church_admin' THEN 'Church Admin'
        WHEN role = 'community_admin' THEN 'Community Admin'
        WHEN role = 'member' THEN 'Member'
        ELSE 'Unknown Role'
    END as role_description
FROM users
ORDER BY
    CASE role
        WHEN 'super_admin' THEN 1
        WHEN 'church_super_admin' THEN 2
        WHEN 'church_admin' THEN 3
        WHEN 'community_admin' THEN 4
        WHEN 'member' THEN 5
        ELSE 6
    END,
    email;