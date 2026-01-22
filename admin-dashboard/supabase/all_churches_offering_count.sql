-- 전체 교회의 헌금 하위 항목 개수 확인

-- [1] 전체 교회별 헌금 하위 항목 개수 (간단 버전)
SELECT
  ac.church_id,
  c.name as church_name,
  c.denomination,
  COUNT(ac2.id) as total_subcategories,
  COUNT(CASE WHEN ac2.is_offering = true THEN 1 END) as offering_subcategories
FROM account_categories ac
LEFT JOIN churches c ON c.id = ac.church_id
LEFT JOIN account_categories ac2 ON ac2.church_id = ac.church_id AND ac2.parent_id = ac.id
WHERE ac.name = '헌금'
  AND ac.type = 'income'
  AND ac.parent_id IS NULL
GROUP BY ac.church_id, c.name, c.denomination
ORDER BY ac.church_id;

-- [2] 전체 교회별 헌금 하위 항목 개수 + 항목 리스트 (상세 버전)
SELECT
  ac.church_id,
  c.name as church_name,
  COUNT(ac2.id) as total_subcategories,
  COUNT(CASE WHEN ac2.is_offering = true THEN 1 END) as offering_subcategories,
  STRING_AGG(ac2.name, ', ' ORDER BY ac2.display_order) as subcategory_list
FROM account_categories ac
LEFT JOIN churches c ON c.id = ac.church_id
LEFT JOIN account_categories ac2 ON ac2.church_id = ac.church_id AND ac2.parent_id = ac.id
WHERE ac.name = '헌금'
  AND ac.type = 'income'
  AND ac.parent_id IS NULL
GROUP BY ac.church_id, c.name
ORDER BY ac.church_id;

-- [3] 요약: 헌금 하위 항목이 없는 교회 vs 있는 교회
SELECT
  CASE
    WHEN COUNT(ac2.id) = 0 THEN '하위 항목 없음'
    ELSE '하위 항목 있음'
  END as status,
  COUNT(DISTINCT ac.church_id) as church_count
FROM account_categories ac
LEFT JOIN account_categories ac2 ON ac2.church_id = ac.church_id AND ac2.parent_id = ac.id
WHERE ac.name = '헌금'
  AND ac.type = 'income'
  AND ac.parent_id IS NULL
  AND ac.church_id != 0
GROUP BY (COUNT(ac2.id) = 0);

-- [4] 0번 교회(템플릿)의 헌금 하위 항목
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
