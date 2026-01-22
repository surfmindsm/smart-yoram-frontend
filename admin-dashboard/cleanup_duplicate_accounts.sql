-- Church ID 56의 중복 계정과목 정리 스크립트
-- 각 중복 그룹에서 가장 오래된 ID(최소 ID)만 남기고 나머지 삭제

BEGIN;

-- 1단계: 중복된 계정과목 ID 확인
WITH duplicate_categories AS (
  SELECT
    id,
    church_id,
    name,
    type,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY church_id, name, type ORDER BY id ASC) as rn
  FROM account_categories
  WHERE church_id = 56 AND type = 'income'
)
SELECT
  id,
  name,
  type,
  created_at,
  CASE WHEN rn = 1 THEN '유지' ELSE '삭제 예정' END as action
FROM duplicate_categories
WHERE name IN (
  '학생회헌금', '이자수입', '특별헌금', '주일학교헌금', '선교헌금',
  '주일헌금', '절기헌금-송구영신', '십일조', '감사헌금', '절기헌금-성탄절',
  '건축헌금', '구역헌금', '생일감사헌금', '절기헌금-맥추감사절', '기타수입', '일천번제헌금'
)
ORDER BY name, id;

-- 2단계: 삭제할 ID 목록 확인 (rn > 1인 것들)
WITH duplicate_categories AS (
  SELECT
    id,
    church_id,
    name,
    type,
    ROW_NUMBER() OVER (PARTITION BY church_id, name, type ORDER BY id ASC) as rn
  FROM account_categories
  WHERE church_id = 56 AND type = 'income'
),
ids_to_delete AS (
  SELECT id
  FROM duplicate_categories
  WHERE rn > 1
    AND name IN (
      '학생회헌금', '이자수입', '특별헌금', '주일학교헌금', '선교헌금',
      '주일헌금', '절기헌금-송구영신', '십일조', '감사헌금', '절기헌금-성탄절',
      '건축헌금', '구역헌금', '생일감사헌금', '절기헌금-맥추감사절', '기타수입', '일천번제헌금'
    )
)
SELECT COUNT(*) as "삭제될 레코드 수" FROM ids_to_delete;

-- 3단계: accounting_transactions 테이블에서 참조 여부 확인
WITH duplicate_categories AS (
  SELECT
    id,
    church_id,
    name,
    type,
    ROW_NUMBER() OVER (PARTITION BY church_id, name, type ORDER BY id ASC) as rn
  FROM account_categories
  WHERE church_id = 56 AND type = 'income'
),
ids_to_delete AS (
  SELECT id
  FROM duplicate_categories
  WHERE rn > 1
    AND name IN (
      '학생회헌금', '이자수입', '특별헌금', '주일학교헌금', '선교헌금',
      '주일헌금', '절기헌금-송구영신', '십일조', '감사헌금', '절기헌금-성탄절',
      '건축헌금', '구역헌금', '생일감사헌금', '절기헌금-맥추감사절', '기타수입', '일천번제헌금'
    )
)
SELECT
  at.category_id,
  ac.name as category_name,
  COUNT(*) as transaction_count
FROM accounting_transactions at
JOIN account_categories ac ON at.category_id = ac.id
WHERE at.category_id IN (SELECT id FROM ids_to_delete)
GROUP BY at.category_id, ac.name
ORDER BY transaction_count DESC;

-- 4단계: 참조가 있는 경우, 유지할 ID로 업데이트
WITH duplicate_categories AS (
  SELECT
    id,
    church_id,
    name,
    type,
    ROW_NUMBER() OVER (PARTITION BY church_id, name, type ORDER BY id ASC) as rn
  FROM account_categories
  WHERE church_id = 56 AND type = 'income'
),
id_mapping AS (
  SELECT
    d_old.id as old_id,
    d_keep.id as new_id,
    d_old.name
  FROM duplicate_categories d_old
  JOIN duplicate_categories d_keep
    ON d_old.church_id = d_keep.church_id
    AND d_old.name = d_keep.name
    AND d_old.type = d_keep.type
    AND d_keep.rn = 1
  WHERE d_old.rn > 1
    AND d_old.name IN (
      '학생회헌금', '이자수입', '특별헌금', '주일학교헌금', '선교헌금',
      '주일헌금', '절기헌금-송구영신', '십일조', '감사헌금', '절기헌금-성탄절',
      '건축헌금', '구역헌금', '생일감사헌금', '절기헌금-맥추감사절', '기타수입', '일천번제헌금'
    )
)
UPDATE accounting_transactions
SET category_id = id_mapping.new_id
FROM id_mapping
WHERE accounting_transactions.category_id = id_mapping.old_id;

-- 5단계: 중복 레코드 삭제
WITH duplicate_categories AS (
  SELECT
    id,
    church_id,
    name,
    type,
    ROW_NUMBER() OVER (PARTITION BY church_id, name, type ORDER BY id ASC) as rn
  FROM account_categories
  WHERE church_id = 56 AND type = 'income'
)
DELETE FROM account_categories
WHERE id IN (
  SELECT id
  FROM duplicate_categories
  WHERE rn > 1
    AND name IN (
      '학생회헌금', '이자수입', '특별헌금', '주일학교헌금', '선교헌금',
      '주일헌금', '절기헌금-송구영신', '십일조', '감사헌금', '절기헌금-성탄절',
      '건축헌금', '구역헌금', '생일감사헌금', '절기헌금-맥추감사절', '기타수입', '일천번제헌금'
    )
);

-- 6단계: 최종 확인
SELECT
  name,
  COUNT(*) as count
FROM account_categories
WHERE church_id = 56
  AND type = 'income'
  AND name IN (
    '학생회헌금', '이자수입', '특별헌금', '주일학교헌금', '선교헌금',
    '주일헌금', '절기헌금-송구영신', '십일조', '감사헌금', '절기헌금-성탄절',
    '건축헌금', '구역헌금', '생일감사헌금', '절기헌금-맥추감사절', '기타수입', '일천번제헌금'
  )
GROUP BY name
HAVING COUNT(*) > 1;

COMMIT;
