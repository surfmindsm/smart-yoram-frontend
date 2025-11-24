-- church_id = 7에 헌금 계정과목 추가
-- (템플릿에서 복사)

-- 1. 헌금 상위 카테고리 추가
INSERT INTO public.account_categories (church_id, name, type, display_order, is_active)
SELECT 7, '헌금', 'income', 0, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.account_categories
  WHERE church_id = 7 AND name = '헌금'
);

-- 2. 헌금 하위 항목들 추가
INSERT INTO public.account_categories (church_id, name, type, parent_id, display_order, is_active)
SELECT 7, '십일조', 'income', id, 1, true
FROM public.account_categories
WHERE church_id = 7 AND name = '헌금'
AND NOT EXISTS (
  SELECT 1 FROM public.account_categories
  WHERE church_id = 7 AND name = '십일조'
);

INSERT INTO public.account_categories (church_id, name, type, parent_id, display_order, is_active)
SELECT 7, '주일헌금', 'income', id, 2, true
FROM public.account_categories
WHERE church_id = 7 AND name = '헌금'
AND NOT EXISTS (
  SELECT 1 FROM public.account_categories
  WHERE church_id = 7 AND name = '주일헌금'
);

INSERT INTO public.account_categories (church_id, name, type, parent_id, display_order, is_active)
SELECT 7, '감사헌금', 'income', id, 3, true
FROM public.account_categories
WHERE church_id = 7 AND name = '헌금'
AND NOT EXISTS (
  SELECT 1 FROM public.account_categories
  WHERE church_id = 7 AND name = '감사헌금'
);

INSERT INTO public.account_categories (church_id, name, type, parent_id, display_order, is_active)
SELECT 7, '선교헌금', 'income', id, 4, true
FROM public.account_categories
WHERE church_id = 7 AND name = '헌금'
AND NOT EXISTS (
  SELECT 1 FROM public.account_categories
  WHERE church_id = 7 AND name = '선교헌금'
);

INSERT INTO public.account_categories (church_id, name, type, parent_id, display_order, is_active)
SELECT 7, '건축헌금', 'income', id, 5, true
FROM public.account_categories
WHERE church_id = 7 AND name = '헌금'
AND NOT EXISTS (
  SELECT 1 FROM public.account_categories
  WHERE church_id = 7 AND name = '건축헌금'
);

INSERT INTO public.account_categories (church_id, name, type, parent_id, display_order, is_active)
SELECT 7, '절기헌금', 'income', id, 6, true
FROM public.account_categories
WHERE church_id = 7 AND name = '헌금'
AND NOT EXISTS (
  SELECT 1 FROM public.account_categories
  WHERE church_id = 7 AND name = '절기헌금'
);

INSERT INTO public.account_categories (church_id, name, type, parent_id, display_order, is_active)
SELECT 7, '특별헌금', 'income', id, 7, true
FROM public.account_categories
WHERE church_id = 7 AND name = '헌금'
AND NOT EXISTS (
  SELECT 1 FROM public.account_categories
  WHERE church_id = 7 AND name = '특별헌금'
);

INSERT INTO public.account_categories (church_id, name, type, parent_id, display_order, is_active)
SELECT 7, '기타헌금', 'income', id, 8, true
FROM public.account_categories
WHERE church_id = 7 AND name = '헌금'
AND NOT EXISTS (
  SELECT 1 FROM public.account_categories
  WHERE church_id = 7 AND name = '기타헌금'
);

-- 결과 확인
SELECT
  '✅ 추가 완료 - church_id = 7 헌금 계정과목' as result,
  COUNT(*) as total_count
FROM account_categories
WHERE church_id = 7
  AND (name = '헌금' OR parent_id IN (
    SELECT id FROM account_categories WHERE name = '헌금' AND church_id = 7
  ));

-- 전체 계정과목 개수 확인
SELECT
  '✅ church_id = 7 전체 계정과목' as result,
  COUNT(*) as total_count,
  '개 (템플릿: 35개)' as note
FROM account_categories
WHERE church_id = 7;
