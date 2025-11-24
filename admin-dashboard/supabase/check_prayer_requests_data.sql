-- Check existing prayer_requests data and foreign key

-- 1. Check how many prayer requests exist
SELECT COUNT(*) as total_prayer_requests FROM public.prayer_requests;

-- 2. Check how many have member_id set
SELECT
  COUNT(*) as total,
  COUNT(member_id) as with_member_id,
  COUNT(*) - COUNT(member_id) as without_member_id
FROM public.prayer_requests;

-- 3. Check existing foreign key constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'prayer_requests'
  AND kcu.column_name = 'member_id';

-- 4. Sample data
SELECT id, member_id, requester_name, created_at
FROM public.prayer_requests
LIMIT 5;
