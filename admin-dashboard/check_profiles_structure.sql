-- profiles 테이블 구조 확인
-- 이 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. profiles 테이블의 모든 컬럼 확인
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. profiles 테이블 데이터 샘플 확인 (컬럼 이름이 뭔지 확인)
SELECT *
FROM public.profiles
LIMIT 5;

-- 3. users 테이블 구조 확인 (auth 스키마)
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. public.users 테이블 샘플 데이터
SELECT *
FROM public.users
LIMIT 5;
