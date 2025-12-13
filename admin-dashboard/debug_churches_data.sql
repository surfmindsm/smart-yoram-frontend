-- churches 테이블 데이터 및 문제 진단
-- 이 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. churches 테이블에 데이터가 있는지 확인
SELECT
    id,
    name,
    pastor_name,
    address,
    phone,
    email,
    homepage_url,
    youtube_channel,
    created_at,
    updated_at
FROM public.churches
ORDER BY id
LIMIT 20;

-- 2. churches 테이블 총 레코드 수
SELECT COUNT(*) as total_churches
FROM public.churches;

-- 3. 최근 업데이트된 교회 정보 (최근 수정한 것이 있는지 확인)
SELECT
    id,
    name,
    updated_at,
    created_at
FROM public.churches
ORDER BY updated_at DESC NULLS LAST
LIMIT 10;

-- 4. users/profiles 테이블에서 church_id 확인
-- (어떤 사용자가 어떤 교회에 속해있는지)
SELECT
    id as user_id,
    email,
    raw_user_meta_data->>'church_id' as church_id_from_metadata,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 5. profiles 테이블 확인 (있는 경우)
SELECT
    user_id,
    church_id,
    role,
    name
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;
