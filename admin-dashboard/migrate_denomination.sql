-- =====================================================
-- Church Applications → Churches Denomination 마이그레이션
-- =====================================================
-- 이 스크립트를 Supabase Studio SQL Editor에서 실행하세요
-- (https://supabase.com/dashboard → SQL Editor → New Query)

-- 1. 기존 승인된 신청서들 중 이메일이 일치하는 교회의 denomination 업데이트
UPDATE churches c
SET
  denomination = COALESCE(ca.denomination, c.denomination),
  homepage_url = COALESCE(c.homepage_url, ca.homepage_url, ca.website),
  youtube_channel = COALESCE(c.youtube_channel, ca.youtube_channel),
  business_no = COALESCE(c.business_no, ca.business_no),
  established_date = CASE
    WHEN ca.established_year IS NOT NULL AND c.established_date IS NULL
    THEN make_date(ca.established_year, 1, 1)
    ELSE c.established_date
  END,
  updated_at = NOW()
FROM church_applications ca
WHERE ca.status = 'approved'
  AND ca.email = c.email
  AND (
    c.denomination IS NULL OR c.denomination = '' OR
    c.homepage_url IS NULL OR
    c.youtube_channel IS NULL OR
    c.business_no IS NULL OR
    c.established_date IS NULL
  );

-- 2. 승인되었지만 아직 churches에 없는 신청서들을 새로운 교회로 추가
INSERT INTO churches (
  id,
  name,
  pastor_name,
  email,
  phone,
  address,
  denomination,
  established_date,
  homepage_url,
  youtube_channel,
  business_no,
  subscription_status,
  subscription_plan,
  is_active,
  member_limit,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  ca.church_name,
  ca.pastor_name,
  ca.email,
  ca.phone,
  ca.address,
  ca.denomination,
  CASE
    WHEN ca.established_year IS NOT NULL
    THEN make_date(ca.established_year, 1, 1)
    ELSE NULL
  END,
  COALESCE(ca.homepage_url, ca.website),
  ca.youtube_channel,
  ca.business_no,
  'active',
  'trial',
  true,
  500,
  NOW(),
  NOW()
FROM church_applications ca
WHERE ca.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM churches c WHERE c.email = ca.email
  );

-- 3. 앞으로 신청서가 승인될 때 자동으로 교회 생성하는 트리거 함수
CREATE OR REPLACE FUNCTION auto_create_church_from_application()
RETURNS TRIGGER AS $$
DECLARE
  new_church_id UUID;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    IF NOT EXISTS (SELECT 1 FROM churches WHERE email = NEW.email) THEN
      INSERT INTO churches (
        id, name, pastor_name, email, phone, address, denomination,
        established_date, homepage_url, youtube_channel, business_no,
        subscription_status, subscription_plan, is_active, member_limit,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), NEW.church_name, NEW.pastor_name, NEW.email,
        NEW.phone, NEW.address, NEW.denomination,
        CASE WHEN NEW.established_year IS NOT NULL
          THEN make_date(NEW.established_year, 1, 1) ELSE NULL END,
        COALESCE(NEW.homepage_url, NEW.website), NEW.youtube_channel,
        NEW.business_no, 'active', 'trial', true, 500, NOW(), NOW()
      )
      RETURNING id INTO new_church_id;
    ELSE
      -- 이미 존재하는 교회는 denomination 등 정보만 업데이트
      UPDATE churches SET
        denomination = COALESCE(NEW.denomination, denomination),
        homepage_url = COALESCE(homepage_url, NEW.homepage_url, NEW.website),
        youtube_channel = COALESCE(youtube_channel, NEW.youtube_channel),
        business_no = COALESCE(business_no, NEW.business_no),
        updated_at = NOW()
      WHERE email = NEW.email;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 생성
DROP TRIGGER IF EXISTS trigger_auto_create_church ON church_applications;
CREATE TRIGGER trigger_auto_create_church
  AFTER UPDATE ON church_applications
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_church_from_application();

-- 5. 결과 확인
SELECT
  c.serial_id,
  c.name as church_name,
  c.denomination,
  c.email,
  ca.church_name as application_name,
  ca.denomination as app_denomination,
  ca.status
FROM churches c
LEFT JOIN church_applications ca ON ca.email = c.email
ORDER BY c.serial_id DESC
LIMIT 20;
