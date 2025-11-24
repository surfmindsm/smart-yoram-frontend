-- church_id = 7에 계정과목이 있는지 확인
SELECT
  '✅ church_id = 7 계정과목 확인' as check_name,
  COUNT(*) as count,
  CASE
    WHEN COUNT(*) = 0 THEN '❌ 계정과목 없음 (회계 관리 화면에 접속하여 자동 복사 필요)'
    ELSE '✅ 계정과목 존재 (' || COUNT(*)::text || '개)'
  END as status
FROM account_categories
WHERE church_id = 7;

-- 헌금 계정과목 확인
SELECT
  '✅ church_id = 7 헌금 계정과목' as check_name,
  id,
  name,
  type,
  parent_id
FROM account_categories
WHERE church_id = 7
  AND (name = '헌금' OR parent_id IN (
    SELECT id FROM account_categories WHERE name = '헌금' AND church_id = 7
  ))
ORDER BY parent_id NULLS FIRST, display_order;

-- 만약 계정과목이 없다면 수동으로 복사하는 쿼리
-- (이 쿼리는 실행하지 말고, 필요할 때만 사용)
/*
-- 템플릿에서 church_id = 7로 복사
INSERT INTO account_categories (church_id, name, type, parent_id, display_order, is_active)
SELECT
  7 as church_id,
  name,
  type,
  NULL as parent_id, -- 나중에 업데이트
  display_order,
  is_active
FROM account_categories
WHERE church_id = 0 AND parent_id IS NULL;

-- 하위 항목 복사 (parent_id 매핑 필요)
-- accounting Edge Function의 자동 복사 로직을 사용하는 것이 더 안전합니다
*/
