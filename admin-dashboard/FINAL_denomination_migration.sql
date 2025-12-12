-- =====================================================
-- Churches 테이블에 denomination 컬럼 추가 및 데이터 마이그레이션
-- =====================================================
-- Supabase Studio SQL Editor에서 실행:
-- https://supabase.com/dashboard/project/adzhdsajdamrflvybhxq/sql/new

-- 1. denomination 컬럼 추가
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS denomination VARCHAR(100);

-- 2. Email 기준으로 denomination 복사 (1순위)
UPDATE public.churches c
SET
  denomination = ca.denomination,
  updated_at = NOW()
FROM church_applications ca
WHERE ca.status = 'approved'
  AND ca.email = c.email
  AND ca.denomination IS NOT NULL
  AND ca.denomination != '';

-- 3. 교회명 기준으로 denomination 복사 (2순위 - email로 매칭 안 된 경우)
UPDATE public.churches c
SET
  denomination = ca.denomination,
  updated_at = NOW()
FROM church_applications ca
WHERE ca.status = 'approved'
  AND ca.church_name = c.name
  AND ca.denomination IS NOT NULL
  AND ca.denomination != ''
  AND (c.denomination IS NULL OR c.denomination = '');

-- 4. 결과 확인
SELECT
  c.serial_id,
  c.name AS church_name,
  c.denomination,
  c.email,
  ca.church_name AS application_name,
  ca.denomination AS app_denomination,
  CASE
    WHEN ca.email = c.email THEN 'Email 매칭'
    WHEN ca.church_name = c.name THEN '교회명 매칭'
    ELSE '매칭 없음'
  END AS matching_method
FROM public.churches c
LEFT JOIN church_applications ca ON
  (ca.status = 'approved' AND (ca.email = c.email OR ca.church_name = c.name))
WHERE c.denomination IS NOT NULL
ORDER BY c.serial_id DESC
LIMIT 20;

-- 5. 전체 통계
SELECT
  COUNT(*) as total_churches,
  COUNT(denomination) as churches_with_denomination,
  COUNT(*) - COUNT(denomination) as churches_without_denomination
FROM public.churches;
