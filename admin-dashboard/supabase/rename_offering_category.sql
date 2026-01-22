-- 모든 교회의 "성교헌금" → "선교헌금"으로 일괄 변경

-- 1단계: 변경 전 상태 확인
SELECT
  '변경 전' as status,
  church_id,
  id,
  name,
  parent_id
FROM account_categories
WHERE name = '성교헌금'
  AND type = 'income'
  AND parent_id IN (
    SELECT id FROM account_categories
    WHERE name = '헌금' AND type = 'income' AND parent_id IS NULL
  )
ORDER BY church_id;

-- 2단계: "성교헌금" → "선교헌금"으로 변경
UPDATE account_categories
SET
  name = '선교헌금',
  updated_at = NOW()
WHERE name = '성교헌금'
  AND type = 'income'
  AND parent_id IN (
    SELECT id FROM account_categories
    WHERE name = '헌금' AND type = 'income' AND parent_id IS NULL
  );

-- 3단계: 변경 후 상태 확인
SELECT
  '변경 후' as status,
  church_id,
  id,
  name,
  parent_id
FROM account_categories
WHERE name = '선교헌금'
  AND type = 'income'
  AND parent_id IN (
    SELECT id FROM account_categories
    WHERE name = '헌금' AND type = 'income' AND parent_id IS NULL
  )
ORDER BY church_id;

-- 4단계: 변경된 교회 수 확인
SELECT
  COUNT(DISTINCT church_id) as changed_churches_count,
  COUNT(*) as changed_items_count
FROM account_categories
WHERE name = '선교헌금'
  AND type = 'income'
  AND parent_id IN (
    SELECT id FROM account_categories
    WHERE name = '헌금' AND type = 'income' AND parent_id IS NULL
  );

-- 5단계: "성교헌금"이 남아있는지 확인 (0개여야 함)
SELECT
  COUNT(*) as remaining_old_name_count
FROM account_categories
WHERE name = '성교헌금'
  AND type = 'income'
  AND parent_id IN (
    SELECT id FROM account_categories
    WHERE name = '헌금' AND type = 'income' AND parent_id IS NULL
  );
