-- 1. public 스키마의 모든 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. users 또는 profiles 테이블이 있는지 확인
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name IN ('users', 'profiles', 'members')
  AND table_schema IN ('public', 'auth')
ORDER BY table_schema, table_name;

-- 3. members 테이블의 user_id 컬럼 타입 확인
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'members'
  AND column_name IN ('user_id', 'id', 'church_id')
ORDER BY ordinal_position;
