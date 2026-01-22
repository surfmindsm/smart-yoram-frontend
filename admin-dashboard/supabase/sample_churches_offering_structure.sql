-- 랜덤 3개 교회의 헌금 및 헌금 하위 항목 구조 확인

-- [1] 랜덤으로 3개 교회 선택 (헌금 카테고리가 있는 교회 중에서)
WITH random_churches AS (
  SELECT ac.church_id, RANDOM() as rand
  FROM account_categories ac
  WHERE ac.name = '헌금'
    AND ac.type = 'income'
    AND ac.parent_id IS NULL
    AND ac.church_id != 0
  GROUP BY ac.church_id
  ORDER BY rand
  LIMIT 3
)
SELECT
  rc.church_id,
  c.name as church_name,
  c.denomination
FROM random_churches rc
LEFT JOIN churches c ON c.id = rc.church_id
ORDER BY rc.church_id;

-- [2] 위에서 선택된 교회들의 헌금 상위 카테고리 정보
WITH random_churches AS (
  SELECT ac.church_id, RANDOM() as rand
  FROM account_categories ac
  WHERE ac.name = '헌금'
    AND ac.type = 'income'
    AND ac.parent_id IS NULL
    AND ac.church_id != 0
  GROUP BY ac.church_id
  ORDER BY rand
  LIMIT 3
)
SELECT
  ac.church_id,
  c.name as church_name,
  ac.id as category_id,
  ac.name as category_name,
  ac.type,
  ac.parent_id,
  ac.is_offering,
  ac.is_active
FROM account_categories ac
JOIN random_churches rc ON rc.church_id = ac.church_id
LEFT JOIN churches c ON c.id = ac.church_id
WHERE ac.name = '헌금'
  AND ac.type = 'income'
  AND ac.parent_id IS NULL
ORDER BY ac.church_id;

-- [3] 위에서 선택된 교회들의 헌금 하위 항목 목록 (상세)
WITH random_churches AS (
  SELECT ac.church_id, RANDOM() as rand
  FROM account_categories ac
  WHERE ac.name = '헌금'
    AND ac.type = 'income'
    AND ac.parent_id IS NULL
    AND ac.church_id != 0
  GROUP BY ac.church_id
  ORDER BY rand
  LIMIT 3
)
SELECT
  ac.church_id,
  c.name as church_name,
  ac.id as subcategory_id,
  ac.name as subcategory_name,
  ac.parent_id,
  ac.is_offering,
  ac.is_active,
  ac.display_order,
  parent.name as parent_category_name
FROM account_categories ac
JOIN random_churches rc ON rc.church_id = ac.church_id
LEFT JOIN churches c ON c.id = ac.church_id
LEFT JOIN account_categories parent ON parent.id = ac.parent_id
WHERE ac.parent_id IN (
    SELECT id FROM account_categories
    WHERE church_id = ac.church_id
      AND name = '헌금'
      AND type = 'income'
      AND parent_id IS NULL
  )
ORDER BY ac.church_id, ac.display_order;

-- [4] 각 교회별 헌금 하위 항목 개수 요약
WITH random_churches AS (
  SELECT ac.church_id, RANDOM() as rand
  FROM account_categories ac
  WHERE ac.name = '헌금'
    AND ac.type = 'income'
    AND ac.parent_id IS NULL
    AND ac.church_id != 0
  GROUP BY ac.church_id
  ORDER BY rand
  LIMIT 3
)
SELECT
  ac.church_id,
  c.name as church_name,
  COUNT(ac2.id) as total_subcategories,
  COUNT(CASE WHEN ac2.is_offering = true THEN 1 END) as offering_subcategories,
  STRING_AGG(ac2.name, ', ' ORDER BY ac2.display_order) as subcategory_list
FROM account_categories ac
JOIN random_churches rc ON rc.church_id = ac.church_id
LEFT JOIN churches c ON c.id = ac.church_id
LEFT JOIN account_categories ac2 ON ac2.church_id = ac.church_id AND ac2.parent_id = ac.id
WHERE ac.name = '헌금'
  AND ac.type = 'income'
  AND ac.parent_id IS NULL
GROUP BY ac.church_id, c.name
ORDER BY ac.church_id;

-- [5] 보너스: 0번 교회(템플릿)의 헌금 구조도 함께 확인
SELECT
  '0번 교회 (템플릿)' as info,
  COUNT(ac.id) as total_subcategories,
  STRING_AGG(ac.name, ', ' ORDER BY ac.display_order) as subcategory_list
FROM account_categories ac
WHERE ac.church_id = 0
  AND ac.type = 'income'
  AND ac.parent_id IN (
    SELECT id FROM account_categories
    WHERE church_id = 0 AND name = '헌금' AND type = 'income' AND parent_id IS NULL
  );
