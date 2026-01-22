-- 1. 중복된 계정과목 상세 조회
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
  created_at,
  CASE WHEN rn = 1 THEN '✅ 유지' ELSE '❌ 삭제 예정' END as action
FROM duplicate_categories
WHERE name IN (
  '학생회헌금', '이자수입', '특별헌금', '주일학교헌금', '선교헌금',
  '주일헌금', '절기헌금-송구영신', '십일조', '감사헌금', '절기헌금-성탄절',
  '건축헌금', '구역헌금', '생일감사헌금', '절기헌금-맥추감사절', '기타수입', '일천번제헌금'
)
ORDER BY name, id;
