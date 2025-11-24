-- ========================================
-- 회계 시스템 마이그레이션 검증 SQL
-- ========================================

-- 1. 테이블 존재 확인
SELECT
  '✅ 테이블 존재 확인' as check_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'account_categories') THEN '✓ account_categories 존재'
    ELSE '✗ account_categories 없음'
  END as account_categories,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounting_transactions') THEN '✓ accounting_transactions 존재'
    ELSE '✗ accounting_transactions 없음'
  END as accounting_transactions;

-- 2. offerings 테이블에 accounting_transaction_id 컬럼 추가 확인
SELECT
  '✅ offerings 테이블 컬럼 확인' as check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'offerings' AND column_name = 'accounting_transaction_id'
    ) THEN '✓ accounting_transaction_id 컬럼 존재'
    ELSE '✗ accounting_transaction_id 컬럼 없음'
  END as column_exists;

-- 3. 외래키 제약조건 확인
SELECT
  '✅ 외래키 제약조건 확인' as check_name,
  conname as constraint_name,
  '✓ 외래키 존재' as status
FROM pg_constraint
WHERE conname = 'offerings_accounting_transaction_fkey';

-- 4. 인덱스 확인
SELECT
  '✅ 인덱스 확인' as check_name,
  indexname as index_name,
  tablename,
  '✓ 인덱스 존재' as status
FROM pg_indexes
WHERE indexname IN (
  'idx_account_categories_church_id',
  'idx_account_categories_type',
  'idx_account_categories_parent_id',
  'idx_accounting_transactions_church_id',
  'idx_accounting_transactions_date',
  'idx_accounting_transactions_category_id',
  'idx_accounting_transactions_type',
  'idx_offerings_accounting_transaction_id'
)
ORDER BY indexname;

-- 5. RLS 정책 확인
SELECT
  '✅ RLS 정책 확인' as check_name,
  schemaname,
  tablename,
  policyname,
  '✓ 정책 존재' as status
FROM pg_policies
WHERE tablename IN ('account_categories', 'accounting_transactions')
ORDER BY tablename, policyname;

-- 6. 템플릿 계정과목 데이터 확인 (church_id = 0)
SELECT
  '✅ 템플릿 계정과목 개수' as check_name,
  type,
  COUNT(*) as count,
  CASE
    WHEN type = 'income' AND COUNT(*) >= 12 THEN '✓ 수입 계정과목 정상'
    WHEN type = 'expense' AND COUNT(*) >= 8 THEN '✓ 지출 계정과목 정상'
    ELSE '⚠️ 계정과목 수 부족'
  END as status
FROM account_categories
WHERE church_id = 0
GROUP BY type;

-- 7. 헌금 계정과목 상세 확인
SELECT
  '✅ 헌금 계정과목 상세' as check_name,
  id,
  name,
  type,
  parent_id,
  display_order,
  CASE
    WHEN parent_id IS NULL THEN '상위 카테고리'
    ELSE '하위 항목'
  END as category_level
FROM account_categories
WHERE church_id = 0
  AND (name = '헌금' OR parent_id IN (
    SELECT id FROM account_categories WHERE name = '헌금' AND church_id = 0
  ))
ORDER BY parent_id NULLS FIRST, display_order;

-- 8. 모든 템플릿 계정과목 목록 (계층 구조)
SELECT
  '✅ 전체 템플릿 계정과목' as check_name,
  id,
  name,
  type,
  parent_id,
  display_order,
  CASE
    WHEN parent_id IS NULL THEN '📁 ' || name
    ELSE '  └ ' || name
  END as hierarchy_display
FROM account_categories
WHERE church_id = 0
ORDER BY type, display_order, parent_id NULLS FIRST;

-- 9. 데이터 타입 및 제약조건 확인
SELECT
  '✅ account_categories 컬럼 정보' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'account_categories'
ORDER BY ordinal_position;

SELECT
  '✅ accounting_transactions 컬럼 정보' as check_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'accounting_transactions'
ORDER BY ordinal_position;

-- 10. 최종 요약
SELECT
  '========================================' as divider,
  '최종 검증 요약' as summary_title,
  '========================================' as divider2
UNION ALL
SELECT
  '테이블 생성' as item,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.tables
          WHERE table_name IN ('account_categories', 'accounting_transactions')) = 2
    THEN '✅ 완료'
    ELSE '❌ 실패'
  END as status,
  '' as divider2
UNION ALL
SELECT
  'offerings 컬럼 추가' as item,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'offerings' AND column_name = 'accounting_transaction_id')
    THEN '✅ 완료'
    ELSE '❌ 실패'
  END as status,
  '' as divider2
UNION ALL
SELECT
  '템플릿 데이터 삽입' as item,
  CASE
    WHEN (SELECT COUNT(*) FROM account_categories WHERE church_id = 0) >= 20
    THEN '✅ 완료 (' || (SELECT COUNT(*) FROM account_categories WHERE church_id = 0)::text || '개)'
    ELSE '❌ 부족 (' || (SELECT COUNT(*) FROM account_categories WHERE church_id = 0)::text || '개)'
  END as status,
  '' as divider2
UNION ALL
SELECT
  '헌금 계정과목' as item,
  CASE
    WHEN EXISTS (SELECT 1 FROM account_categories WHERE church_id = 0 AND name = '헌금')
    THEN '✅ 완료 (' || (
      SELECT COUNT(*)::text || '개)'
      FROM account_categories
      WHERE church_id = 0
        AND (name = '헌금' OR parent_id IN (
          SELECT id FROM account_categories WHERE name = '헌금' AND church_id = 0
        ))
    )
    ELSE '❌ 실패'
  END as status,
  '' as divider2;
