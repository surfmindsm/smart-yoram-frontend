-- 기존 church_admin 역할을 church_super_admin으로 변경
-- 이는 교회의 첫 번째 관리자(담임목사/교회 관리자)에게 최고 관리자 권한을 부여하기 위함입니다.

-- 변경 전 사용자 수 확인
DO $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM users
  WHERE role = 'church_admin'
    AND church_id != 0  -- Super Admin 제외
    AND church_id != 9998;  -- 커뮤니티 사용자 제외

  RAISE NOTICE '변경 대상 사용자 수: %', user_count;
END $$;

-- church_admin을 church_super_admin으로 변경
UPDATE users
SET role = 'church_super_admin',
    updated_at = NOW()
WHERE role = 'church_admin'
  AND church_id != 0  -- Super Admin 제외
  AND church_id != 9998;  -- 커뮤니티 사용자 제외

-- 변경 후 확인
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM users
  WHERE role = 'church_super_admin'
    AND church_id != 0
    AND church_id != 9998;

  RAISE NOTICE '변경 완료: church_super_admin 역할을 가진 사용자 수: %', updated_count;
END $$;
