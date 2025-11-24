SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pastoral_care_requests'
ORDER BY ordinal_position;
