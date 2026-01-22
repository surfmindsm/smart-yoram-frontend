-- 헌금 상위 카테고리가 없는 교회를 빠르게 확인
SELECT
  c.id as church_id,
  c.serial_id,
  c.name as church_name,
  c.created_at,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM account_categories ac
      WHERE ac.church_id = c.id
        AND ac.name = '헌금'
        AND ac.type = 'income'
        AND ac.parent_id IS NULL
    ) THEN '✅ 있음'
    ELSE '❌ 없음'
  END as has_offering_category,
  (SELECT COUNT(*) FROM account_categories WHERE church_id = c.id) as total_categories
FROM churches c
WHERE c.id != 9998  -- "no church" 제외
ORDER BY c.id;
