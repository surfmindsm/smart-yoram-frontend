-- 모든 교회의 헌금 하위 항목들의 is_offering 플래그를 true로 업데이트

-- 1단계: 현재 상태 확인
SELECT
  '업데이트 전' as status,
  COUNT(*) as total_items,
  COUNT(CASE WHEN is_offering = true THEN 1 END) as offering_true,
  COUNT(CASE WHEN is_offering = false OR is_offering IS NULL THEN 1 END) as offering_false
FROM account_categories
WHERE type = 'income'
  AND parent_id IN (
    SELECT id FROM account_categories
    WHERE name = '헌금' AND type = 'income' AND parent_id IS NULL
  );

-- 2단계: 모든 교회의 헌금 하위 항목들을 is_offering = true로 업데이트
UPDATE account_categories
SET is_offering = true
WHERE type = 'income'
  AND parent_id IN (
    SELECT id FROM account_categories
    WHERE name = '헌금' AND type = 'income' AND parent_id IS NULL
  )
  AND (is_offering = false OR is_offering IS NULL);

-- 3단계: 업데이트 후 상태 확인
SELECT
  '업데이트 후' as status,
  COUNT(*) as total_items,
  COUNT(CASE WHEN is_offering = true THEN 1 END) as offering_true,
  COUNT(CASE WHEN is_offering = false OR is_offering IS NULL THEN 1 END) as offering_false
FROM account_categories
WHERE type = 'income'
  AND parent_id IN (
    SELECT id FROM account_categories
    WHERE name = '헌금' AND type = 'income' AND parent_id IS NULL
  );

-- 4단계: 교회별 업데이트 결과 확인
SELECT
  ac.church_id,
  c.name as church_name,
  COUNT(ac2.id) as total_subcategories,
  COUNT(CASE WHEN ac2.is_offering = true THEN 1 END) as offering_subcategories
FROM account_categories ac
LEFT JOIN churches c ON c.id = ac.church_id
LEFT JOIN account_categories ac2 ON ac2.church_id = ac.church_id AND ac2.parent_id = ac.id
WHERE ac.name = '헌금'
  AND ac.type = 'income'
  AND ac.parent_id IS NULL
GROUP BY ac.church_id, c.name
ORDER BY ac.church_id;
