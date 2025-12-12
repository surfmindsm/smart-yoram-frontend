-- =====================================================
-- Churches 테이블에 denomination 컬럼 추가
-- =====================================================
-- Supabase Studio SQL Editor에서 실행하세요:
-- https://supabase.com/dashboard/project/adzhdsajdamrflvybhxq/sql

-- 1. denomination 컬럼 추가
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS denomination VARCHAR(100);

-- 2. established_date 컬럼 추가 (있으면 무시)
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS established_date DATE;

-- 3. website 컬럼 추가 (있으면 무시)
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS website TEXT;

-- 4. description 컬럼 추가 (있으면 무시)
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS description TEXT;

-- 5. logo_url 컬럼 추가 (있으면 무시)
ALTER TABLE public.churches ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 6. church_applications에서 denomination 데이터 복사
UPDATE public.churches c
SET
  denomination = ca.denomination,
  established_date = CASE
    WHEN ca.established_year IS NOT NULL
    THEN make_date(ca.established_year, 1, 1)
    ELSE c.established_date
  END,
  website = COALESCE(c.website, ca.website),
  description = COALESCE(c.description, ca.description),
  updated_at = NOW()
FROM church_applications ca
WHERE ca.status = 'approved'
  AND ca.email = c.email
  AND ca.denomination IS NOT NULL;

-- 7. 결과 확인
SELECT
  c.serial_id,
  c.name,
  c.denomination,
  c.established_date,
  c.email
FROM public.churches c
WHERE c.denomination IS NOT NULL
ORDER BY c.serial_id DESC
LIMIT 20;

-- 8. 전체 교회 수와 denomination이 있는 교회 수 확인
SELECT
  COUNT(*) as total_churches,
  COUNT(denomination) as churches_with_denomination,
  COUNT(*) - COUNT(denomination) as churches_without_denomination
FROM public.churches;
