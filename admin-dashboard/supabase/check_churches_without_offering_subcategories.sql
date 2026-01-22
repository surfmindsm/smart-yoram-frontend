-- 헌금 관련 데이터 확인용 쿼리 모음

-- [1] 먼저 '헌금'이라는 이름의 카테고리가 있는지 확인 (모든 교회)
SELECT
  church_id,
  id,
  name,
  type,
  parent_id,
  is_offering,
  is_active
FROM account_categories
WHERE name LIKE '%헌금%'
  AND type = 'income'
ORDER BY church_id, parent_id NULLS FIRST, display_order;

-- [2] 각 교회별 '헌금' 상위 카테고리 확인
SELECT
  ac.church_id,
  c.name as church_name,
  ac.id as parent_category_id,
  ac.name as category_name,
  ac.parent_id,
  ac.is_offering
FROM account_categories ac
LEFT JOIN churches c ON c.id = ac.church_id
WHERE ac.name = '헌금'
  AND ac.type = 'income'
  AND ac.parent_id IS NULL
ORDER BY ac.church_id;

-- [3] 각 교회별 헌금 하위 항목 개수 (is_offering 조건 없이)
SELECT
  ac.church_id,
  c.name as church_name,
  ac.id as parent_category_id,
  COUNT(ac2.id) as subcategory_count,
  STRING_AGG(ac2.name, ', ') as subcategory_names
FROM account_categories ac
LEFT JOIN churches c ON c.id = ac.church_id
LEFT JOIN account_categories ac2 ON ac2.church_id = ac.church_id AND ac2.parent_id = ac.id
WHERE ac.name = '헌금'
  AND ac.type = 'income'
  AND ac.parent_id IS NULL
GROUP BY ac.church_id, c.name, ac.id
ORDER BY ac.church_id;

-- [4] 각 교회별 헌금 하위 항목 개수 (is_offering = true 조건 포함)
SELECT
  ac.church_id,
  c.name as church_name,
  ac.id as parent_category_id,
  COUNT(ac2.id) as offering_subcategory_count,
  STRING_AGG(CASE WHEN ac2.is_offering THEN ac2.name ELSE NULL END, ', ') as offering_names
FROM account_categories ac
LEFT JOIN churches c ON c.id = ac.church_id
LEFT JOIN account_categories ac2 ON ac2.church_id = ac.church_id
  AND ac2.parent_id = ac.id
  AND ac2.is_offering = true
WHERE ac.name = '헌금'
  AND ac.type = 'income'
  AND ac.parent_id IS NULL
GROUP BY ac.church_id, c.name, ac.id
ORDER BY ac.church_id;

-- [5] 헌금 상위 카테고리는 있지만 하위 항목이 없는 교회 (최종 조건)
SELECT
  ac.church_id,
  c.name as church_name,
  ac.id as parent_category_id,
  ac.name as parent_category_name
FROM account_categories ac
LEFT JOIN churches c ON c.id = ac.church_id
WHERE ac.name = '헌금'
  AND ac.type = 'income'
  AND ac.parent_id IS NULL
  AND ac.church_id != 0  -- 템플릿 제외
  AND NOT EXISTS (
    SELECT 1
    FROM account_categories ac2
    WHERE ac2.church_id = ac.church_id
      AND ac2.parent_id = ac.id
  )
ORDER BY ac.church_id;

-- [6] 0번 교회(템플릿)의 헌금 상위 카테고리
SELECT
  id,
  name,
  type,
  parent_id,
  is_offering
FROM account_categories
WHERE church_id = 0
  AND name = '헌금'
  AND type = 'income'
  AND parent_id IS NULL;

-- [7] 0번 교회(템플릿)의 헌금 하위 항목 목록 (모든 하위 항목)
SELECT
  ac.id,
  ac.name,
  ac.parent_id,
  ac.display_order,
  ac.is_offering,
  ac.description,
  parent.name as parent_name
FROM account_categories ac
LEFT JOIN account_categories parent ON parent.id = ac.parent_id
WHERE ac.church_id = 0
  AND ac.type = 'income'
  AND ac.parent_id IN (
    SELECT id FROM account_categories
    WHERE church_id = 0 AND name = '헌금' AND type = 'income' AND parent_id IS NULL
  )
ORDER BY ac.display_order;
