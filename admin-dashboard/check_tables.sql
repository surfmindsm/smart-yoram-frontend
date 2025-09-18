-- 현재 데이터베이스의 모든 테이블 조회
SELECT
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 테이블별 컬럼 정보 조회
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 테이블별 행 수 확인 (대략적인 크기 파악)
SELECT
    schemaname,
    relname as table_name,
    n_tup_ins as "총 삽입된 행",
    n_tup_upd as "업데이트된 행",
    n_tup_del as "삭제된 행",
    n_live_tup as "현재 활성 행"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;