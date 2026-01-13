-- 문제가 있는 두 사용자 완전 삭제 SQL
-- qgc700415@gmail.com (초대 오류)
-- a01091896922@gmail.com (로그인 실패)

-- 실행 전 주의사항:
-- 1. 반드시 백업을 먼저 수행하세요
-- 2. 실제 실행 전에 SELECT 쿼리로 삭제될 데이터를 확인하세요

-- ============================================================
-- 1단계: 삭제될 데이터 확인 (실행 전 확인용)
-- ============================================================

-- public.users 테이블에서 해당 이메일 확인
SELECT id, email, phone, created_at
FROM public.users
WHERE email IN ('qgc700415@gmail.com', 'a01091896922@gmail.com');

-- public.members 테이블에서 해당 이메일 확인
SELECT id, name, email, phone, user_id, church_id
FROM public.members
WHERE email IN ('qgc700415@gmail.com', 'a01091896922@gmail.com');

-- ============================================================
-- 2단계: 실제 삭제 (트랜잭션 사용)
-- ============================================================

BEGIN;

-- 2-1. members와 연결된 관련 테이블 먼저 삭제 (외래 키 제약이 있는 경우)
-- member_id를 기준으로 관련 데이터 삭제

-- member_contacts 삭제 (있는 경우)
DELETE FROM public.member_contacts
WHERE member_id IN (
    SELECT id FROM public.members
    WHERE email IN ('qgc700415@gmail.com', 'a01091896922@gmail.com')
);

-- member_vehicles 삭제 (있는 경우)
DELETE FROM public.member_vehicles
WHERE member_id IN (
    SELECT id FROM public.members
    WHERE email IN ('qgc700415@gmail.com', 'a01091896922@gmail.com')
);

-- sacraments 삭제 (있는 경우)
DELETE FROM public.sacraments
WHERE member_id IN (
    SELECT id FROM public.members
    WHERE email IN ('qgc700415@gmail.com', 'a01091896922@gmail.com')
);

-- transfers 삭제 (있는 경우)
DELETE FROM public.transfers
WHERE member_id IN (
    SELECT id FROM public.members
    WHERE email IN ('qgc700415@gmail.com', 'a01091896922@gmail.com')
);

-- member_children 삭제 (있는 경우)
DELETE FROM public.member_children
WHERE parent_member_id IN (
    SELECT id FROM public.members
    WHERE email IN ('qgc700415@gmail.com', 'a01091896922@gmail.com')
);

-- 2-2. public.members 테이블에서 삭제
DELETE FROM public.members
WHERE email IN ('qgc700415@gmail.com', 'a01091896922@gmail.com');

-- 2-3. public.users 테이블에서 삭제
DELETE FROM public.users
WHERE email IN ('qgc700415@gmail.com', 'a01091896922@gmail.com');

-- 삭제 후 확인
SELECT
    'public.users' as table_name,
    COUNT(*) as remaining_count
FROM public.users
WHERE email IN ('qgc700415@gmail.com', 'a01091896922@gmail.com')
UNION ALL
SELECT
    'public.members',
    COUNT(*)
FROM public.members
WHERE email IN ('qgc700415@gmail.com', 'a01091896922@gmail.com');

-- 모든 것이 정상이면 커밋, 아니면 롤백
COMMIT;
-- 문제가 있으면: ROLLBACK;
