-- 모든 테이블 목록 조회 (public 스키마)
SELECT
    table_name,
    table_type
FROM
    information_schema.tables
WHERE
    table_schema = 'public'
    AND table_type = 'BASE TABLE'
ORDER BY
    table_name;

-- 더 상세한 정보 (테이블 + 컬럼 수)
SELECT
    t.table_name,
    COUNT(c.column_name) as column_count,
    pg_size_pretty(pg_total_relation_size('"' || t.table_schema || '"."' || t.table_name || '"')) as total_size
FROM
    information_schema.tables t
LEFT JOIN
    information_schema.columns c
    ON t.table_name = c.table_name
    AND t.table_schema = c.table_schema
WHERE
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY
    t.table_name, t.table_schema
ORDER BY
    t.table_name;

-- 각 테이블의 컬럼 정보까지 모두 조회
SELECT
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default
FROM
    information_schema.tables t
JOIN
    information_schema.columns c
    ON t.table_name = c.table_name
    AND t.table_schema = c.table_schema
WHERE
    t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
ORDER BY
    t.table_name, c.ordinal_position;
