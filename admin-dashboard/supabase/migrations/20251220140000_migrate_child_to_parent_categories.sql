-- 자식 카테고리로 등록된 거래 내역을 부모 카테고리로 마이그레이션
-- 이 마이그레이션은 회계 시스템에서 일관성을 위해 모든 거래를 부모 카테고리로 통일합니다

-- 1단계: 자식 카테고리로 등록된 모든 거래를 부모 카테고리로 업데이트
UPDATE accounting_transactions t
SET category_id = (
  SELECT parent.id
  FROM account_categories child
  JOIN account_categories parent ON child.parent_id = parent.id
  WHERE child.id = t.category_id
    AND child.parent_id IS NOT NULL
    AND t.church_id = child.church_id
)
WHERE category_id IN (
  SELECT id
  FROM account_categories
  WHERE parent_id IS NOT NULL
);

-- 2단계 (선택사항): 더 이상 사용되지 않는 자식 카테고리 삭제
-- 주의: 이 단계는 주석 처리되어 있습니다.
-- 자식 카테고리가 완전히 필요 없다고 확인된 경우에만 실행하세요.
-- DELETE FROM account_categories WHERE parent_id IS NOT NULL;

-- 확인 쿼리: 남아있는 자식 카테고리 확인
-- SELECT * FROM account_categories WHERE parent_id IS NOT NULL;
