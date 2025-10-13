-- ============================================
-- 테스터 계정 생성 SQL (앱 스토어 심사용) - 올바른 버전
-- Email: tester1@test.com
-- Password: test123!@#
-- Church ID: 10
-- ============================================

-- ============================================
-- Step 1: 테스트 교회 생성
-- ============================================
INSERT INTO public.churches (
  id,
  serial_id,
  name,
  address,
  phone,
  email,
  pastor_name,
  subscription_status,
  subscription_end_date,
  member_limit,
  is_active,
  subscription_plan,
  gpt_model,
  current_month_tokens,
  current_month_cost,
  homepage_url,
  youtube_channel,
  created_at,
  updated_at
) VALUES (
  10,
  10,
  '테스트 교회',
  '서울특별시 강남구 테스트로 123',
  '02-1234-5678',
  'test@testchurch.com',
  '김테스트 목사',
  'active',
  NOW() + INTERVAL '1 year',
  500,
  true,
  'standard',
  'gpt-4o-mini',
  0,
  0.0,
  'https://testchurch.com',
  'https://youtube.com/@testchurch',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  pastor_name = EXCLUDED.pastor_name,
  subscription_status = EXCLUDED.subscription_status,
  subscription_end_date = EXCLUDED.subscription_end_date,
  member_limit = EXCLUDED.member_limit,
  is_active = EXCLUDED.is_active,
  subscription_plan = EXCLUDED.subscription_plan,
  homepage_url = EXCLUDED.homepage_url,
  youtube_channel = EXCLUDED.youtube_channel,
  updated_at = NOW();

-- 확인 쿼리
SELECT
  id,
  serial_id,
  name,
  email,
  subscription_status,
  is_active,
  created_at
FROM public.churches
WHERE id = 10;

-- ============================================
-- Step 2: Supabase Dashboard에서 auth.users 생성
-- ============================================
-- 1. Supabase Dashboard > Authentication > Users로 이동
-- 2. "Add user" 버튼 클릭
-- 3. 다음 정보 입력:
--    - Email: tester1@test.com
--    - Password: test123!@#
--    - Auto Confirm User: ✅ 체크 (이메일 인증 스킵)
-- 4. "Create user" 버튼 클릭
-- 5. UUID는 auth.users에만 사용되고, users 테이블은 별도 integer id 사용
-- ============================================

-- ============================================
-- Step 3: users 테이블에 레코드 추가
-- ============================================
-- 주의: users 테이블은 integer id를 사용합니다 (auth.users와 별개)

-- users 테이블에 레코드 추가
INSERT INTO public.users (
  email,
  username,
  hashed_password,
  full_name,
  phone,
  church_id,
  role,
  is_active,
  is_superuser,
  is_first,
  created_at,
  updated_at
) VALUES (
  'tester1@test.com',
  'tester1',
  'supabase_auth',  -- 더미 값 (실제 인증은 auth.users를 통해 이루어짐)
  '테스터',
  '010-0000-0000',
  10,
  'church_admin',
  true,
  false,
  false,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  username = EXCLUDED.username,
  hashed_password = EXCLUDED.hashed_password,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  church_id = EXCLUDED.church_id,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- auth.users의 메타데이터 업데이트
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'church_id', 10,
  'role', 'church_admin',
  'name', '테스터',
  'username', 'tester1'
)
WHERE email = 'tester1@test.com';

-- ============================================
-- Step 4: 최종 확인 쿼리
-- ============================================

-- auth.users 확인
SELECT
  id as auth_user_id,
  email,
  raw_user_meta_data->>'church_id' as church_id,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'name' as name,
  confirmed_at,
  created_at
FROM auth.users
WHERE email = 'tester1@test.com';

-- users 테이블 확인
SELECT
  u.id as user_id,
  u.email,
  u.username,
  u.full_name,
  u.church_id,
  c.name as church_name,
  u.role,
  u.is_active,
  u.created_at
FROM public.users u
LEFT JOIN public.churches c ON u.church_id = c.id
WHERE u.email = 'tester1@test.com';

-- ============================================
-- 완료!
-- 로그인 정보:
-- Email: tester1@test.com
-- Password: test123!@#
-- Church: 테스트 교회 (ID: 10)
-- Role: church_admin (교회 관리자)
-- ============================================
