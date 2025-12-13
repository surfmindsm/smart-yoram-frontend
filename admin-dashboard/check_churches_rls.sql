-- churches 테이블의 RLS 정책 확인
-- 이 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. RLS 활성화 상태 확인
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'churches';

-- 2. churches 테이블의 모든 정책 확인
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'churches'
ORDER BY policyname;

-- 3. 정책 상세 정보 (더 읽기 쉬운 형식)
SELECT
    pol.policyname AS "정책 이름",
    CASE pol.cmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS "명령어",
    CASE pol.permissive
        WHEN 'PERMISSIVE' THEN '허용'
        WHEN 'RESTRICTIVE' THEN '제한'
    END AS "유형",
    pg_get_expr(pol.qual, pol.polrelid) AS "USING 조건",
    pg_get_expr(pol.with_check, pol.polrelid) AS "WITH CHECK 조건"
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pc.relname = 'churches'
AND pn.nspname = 'public'
ORDER BY pol.policyname;

-- 4. 현재 사용자의 권한 확인 (참고용)
SELECT current_user AS "현재 사용자",
       current_database() AS "현재 데이터베이스";
