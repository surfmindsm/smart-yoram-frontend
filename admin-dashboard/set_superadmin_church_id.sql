-- super_admin 사용자에게 교회 ID 할당
-- 이 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. profiles 테이블에서 super_admin 사용자 확인
SELECT id, email, church_id, role, name
FROM public.profiles
WHERE email = 'surfmind.sm@gmail.com';

-- 2. church_id를 6 (성광1교회)로 설정
UPDATE public.profiles
SET church_id = 6
WHERE email = 'surfmind.sm@gmail.com';

-- 3. users 테이블에도 있는지 확인 (있다면)
SELECT id, email, church_id, role
FROM public.users
WHERE email = 'surfmind.sm@gmail.com';

-- 4. users 테이블에도 설정 (있다면)
UPDATE public.users
SET church_id = 6
WHERE email = 'surfmind.sm@gmail.com';

-- 5. 결과 확인
SELECT id, email, church_id, role, name
FROM public.profiles
WHERE email = 'surfmind.sm@gmail.com';
