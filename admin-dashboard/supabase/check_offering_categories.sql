-- ========================================
-- 헌금 계정과목 확인 SQL
-- ========================================

-- 1. 템플릿(church_id=0)의 헌금 계정과목 확인
SELECT
  '✅ 템플릿 헌금 계정과목' as check_name,
  id,
  name,
  type,
  parent_id,
  is_offering,
  display_order
FROM account_categories
WHERE church_id = 0
  AND (name = '헌금' OR parent_id IN (
    SELECT id FROM account_categories WHERE name = '헌금' AND church_id = 0
  ))
ORDER BY parent_id NULLS FIRST, display_order;

-- 2. 템플릿 헌금 카테고리 개수
SELECT
  '✅ 템플릿 헌금 카테고리 개수' as check_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as parent_count,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as child_count
FROM account_categories
WHERE church_id = 0
  AND (name = '헌금' OR parent_id IN (
    SELECT id FROM account_categories WHERE name = '헌금' AND church_id = 0
  ));

-- 3. 모든 교회 목록 (테스트 교회 제외)
SELECT
  '📋 전체 교회 목록' as check_name,
  id,
  serial_id,
  name,
  created_at
FROM churches
WHERE id != 9998  -- "no church" 제외
ORDER BY id;

-- 4. 각 교회별 헌금 상위 카테고리 존재 여부
SELECT
  '🔍 교회별 헌금 상위 카테고리 존재 여부' as check_name,
  c.id as church_id,
  c.serial_id,
  c.name as church_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM account_categories ac
      WHERE ac.church_id = c.id
        AND ac.name = '헌금'
        AND ac.type = 'income'
        AND ac.parent_id IS NULL
    ) THEN '✅ 있음'
    ELSE '❌ 없음'
  END as has_offering_parent
FROM churches c
WHERE c.id != 9998  -- "no church" 제외
ORDER BY c.id;

-- 5. 헌금 상위 카테고리가 없는 교회 목록
SELECT
  '⚠️ 헌금 상위 카테고리가 없는 교회' as check_name,
  c.id as church_id,
  c.serial_id,
  c.name as church_name,
  c.created_at
FROM churches c
WHERE c.id != 9998  -- "no church" 제외
  AND NOT EXISTS (
    SELECT 1 FROM account_categories ac
    WHERE ac.church_id = c.id
      AND ac.name = '헌금'
      AND ac.type = 'income'
      AND ac.parent_id IS NULL
  )
ORDER BY c.id;

-- 6. 각 교회별 전체 수입 계정과목 개수
SELECT
  '📊 교회별 수입 계정과목 개수' as check_name,
  c.id as church_id,
  c.serial_id,
  c.name as church_name,
  COUNT(ac.id) as income_category_count,
  COUNT(CASE WHEN ac.is_offering = true THEN 1 END) as offering_category_count
FROM churches c
LEFT JOIN account_categories ac ON ac.church_id = c.id AND ac.type = 'income'
WHERE c.id != 9998  -- "no church" 제외
GROUP BY c.id, c.serial_id, c.name
ORDER BY c.id;

-- 7. 헌금 하위 항목이 없는 교회 (헌금 상위는 있지만 하위가 없는 경우)
SELECT
  '⚠️ 헌금 하위 항목이 없는 교회' as check_name,
  c.id as church_id,
  c.serial_id,
  c.name as church_name,
  parent.id as parent_category_id,
  parent.name as parent_category_name
FROM churches c
JOIN account_categories parent ON parent.church_id = c.id
  AND parent.name = '헌금'
  AND parent.type = 'income'
  AND parent.parent_id IS NULL
WHERE c.id != 9998  -- "no church" 제외
  AND NOT EXISTS (
    SELECT 1 FROM account_categories child
    WHERE child.church_id = c.id
      AND child.parent_id = parent.id
  )
ORDER BY c.id;

-- 8. 템플릿 vs 실제 교회 비교
SELECT
  '📈 템플릿 대비 교회별 계정과목 복사 상태' as check_name,
  c.id as church_id,
  c.serial_id,
  c.name as church_name,
  (SELECT COUNT(*) FROM account_categories WHERE church_id = 0) as template_count,
  COUNT(ac.id) as church_category_count,
  CASE
    WHEN COUNT(ac.id) = 0 THEN '❌ 계정과목 없음'
    WHEN COUNT(ac.id) < (SELECT COUNT(*) FROM account_categories WHERE church_id = 0) / 2 THEN '⚠️ 계정과목 부족'
    ELSE '✅ 정상'
  END as status
FROM churches c
LEFT JOIN account_categories ac ON ac.church_id = c.id
WHERE c.id != 9998  -- "no church" 제외
GROUP BY c.id, c.serial_id, c.name
ORDER BY church_category_count ASC, c.id;
