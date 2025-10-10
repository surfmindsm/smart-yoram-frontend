-- members 테이블의 모든 컬럼 상세 정보
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'members'
ORDER BY
    ordinal_position;
