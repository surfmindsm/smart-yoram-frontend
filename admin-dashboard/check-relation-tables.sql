-- 관계 테이블들의 컬럼 정보 확인
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('member_contacts', 'member_vehicles', 'sacraments', 'transfers')
ORDER BY table_name, ordinal_position;
