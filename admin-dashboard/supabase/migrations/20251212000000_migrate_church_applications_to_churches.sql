-- church_applications에서 승인된 신청서를 churches 테이블로 마이그레이션
-- denomination 및 기타 필드들을 포함하여 데이터 복사

-- 승인된 church_applications 데이터를 churches로 복사하는 함수
CREATE OR REPLACE FUNCTION migrate_approved_church_applications()
RETURNS void AS $$
DECLARE
  app_record RECORD;
  new_church_id UUID;
BEGIN
  -- 승인되었지만 아직 처리되지 않은 신청서들을 처리
  FOR app_record IN
    SELECT * FROM church_applications
    WHERE status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM churches
      WHERE churches.email = church_applications.email
    )
  LOOP
    -- 새 church 레코드 생성
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
    ) VALUES (
      gen_random_uuid(),
      app_record.church_name,
      app_record.pastor_name,
      app_record.email,
      app_record.phone,
      app_record.address,
      app_record.denomination,
      CASE
        WHEN app_record.established_year IS NOT NULL
        THEN make_date(app_record.established_year, 1, 1)
        ELSE NULL
      END,
      COALESCE(app_record.homepage_url, app_record.website),
      app_record.youtube_channel,
      app_record.business_no,
      'active',
      'trial',
      true,
      500, -- 무료 체험은 500명 제한
      NOW(),
      NOW()
    )
    RETURNING id INTO new_church_id;

    -- 처리 완료 로그
    RAISE NOTICE 'Migrated church application % (%) to church %',
      app_record.church_name, app_record.id, new_church_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 함수 실행하여 기존 승인된 신청서들 마이그레이션
SELECT migrate_approved_church_applications();

-- 앞으로 church_applications이 승인될 때 자동으로 churches에 추가하는 트리거 함수
CREATE OR REPLACE FUNCTION auto_create_church_from_application()
RETURNS TRIGGER AS $$
DECLARE
  new_church_id UUID;
BEGIN
  -- 상태가 approved로 변경되었을 때만 실행
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- 이미 같은 이메일로 등록된 교회가 있는지 확인
    IF NOT EXISTS (SELECT 1 FROM churches WHERE email = NEW.email) THEN
      -- 새 church 레코드 생성
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
      ) VALUES (
        gen_random_uuid(),
        NEW.church_name,
        NEW.pastor_name,
        NEW.email,
        NEW.phone,
        NEW.address,
        NEW.denomination,
        CASE
          WHEN NEW.established_year IS NOT NULL
          THEN make_date(NEW.established_year, 1, 1)
          ELSE NULL
        END,
        COALESCE(NEW.homepage_url, NEW.website),
        NEW.youtube_channel,
        NEW.business_no,
        'active',
        'trial',
        true,
        500, -- 무료 체험은 500명 제한
        NOW(),
        NOW()
      )
      RETURNING id INTO new_church_id;

      RAISE NOTICE 'Auto-created church % from application %', new_church_id, NEW.id;
    ELSE
      RAISE NOTICE 'Church with email % already exists, skipping creation', NEW.email;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (이미 있다면 삭제 후 재생성)
DROP TRIGGER IF EXISTS trigger_auto_create_church ON church_applications;

CREATE TRIGGER trigger_auto_create_church
  AFTER UPDATE ON church_applications
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_church_from_application();

-- 기존 승인된 신청서들 중 아직 churches에 없는 것들을 업데이트
-- (denomination 포함한 모든 필드 업데이트)
DO $$
DECLARE
  app_record RECORD;
  church_record RECORD;
BEGIN
  FOR app_record IN
    SELECT ca.*, c.id as church_id, c.serial_id
    FROM church_applications ca
    JOIN churches c ON c.email = ca.email
    WHERE ca.status = 'approved'
  LOOP
    -- denomination이 비어있거나 다른 경우 업데이트
    UPDATE churches SET
      denomination = COALESCE(app_record.denomination, denomination),
      homepage_url = COALESCE(app_record.homepage_url, app_record.website, homepage_url),
      youtube_channel = COALESCE(app_record.youtube_channel, youtube_channel),
      business_no = COALESCE(app_record.business_no, business_no),
      established_date = CASE
        WHEN app_record.established_year IS NOT NULL AND established_date IS NULL
        THEN make_date(app_record.established_year, 1, 1)
        ELSE established_date
      END,
      updated_at = NOW()
    WHERE id = app_record.church_id
    AND (
      denomination IS NULL OR denomination = '' OR
      homepage_url IS NULL OR
      youtube_channel IS NULL OR
      business_no IS NULL OR
      established_date IS NULL
    );

    RAISE NOTICE 'Updated church % (serial_id: %) with denomination: %',
      app_record.church_name, app_record.serial_id, app_record.denomination;
  END LOOP;
END;
$$;

-- 마이그레이션 함수 정리 (이제 필요 없으므로)
-- DROP FUNCTION IF EXISTS migrate_approved_church_applications();
