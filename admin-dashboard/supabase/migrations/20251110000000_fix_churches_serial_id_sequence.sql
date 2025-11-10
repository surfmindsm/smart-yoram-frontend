-- Fix churches serial_id sequence to prevent duplicate key errors
-- This migration resets the sequence to the next available ID

DO $$
DECLARE
    max_serial_id INTEGER;
BEGIN
    -- Get the current maximum serial_id
    SELECT COALESCE(MAX(serial_id), 0) INTO max_serial_id FROM public.churches;

    RAISE NOTICE 'Current max serial_id: %', max_serial_id;

    -- Reset the sequence to max_serial_id + 1
    -- This ensures the next insert will use an ID that doesn't exist yet
    PERFORM setval(
        pg_get_serial_sequence('public.churches', 'serial_id'),
        max_serial_id + 1,
        false
    );

    RAISE NOTICE 'Serial sequence reset to: %', max_serial_id + 1;
END $$;

-- Verify the sequence is set correctly
SELECT
    COALESCE(MAX(serial_id), 0) as current_max_serial_id,
    nextval(pg_get_serial_sequence('public.churches', 'serial_id')) as next_sequence_value,
    currval(pg_get_serial_sequence('public.churches', 'serial_id')) as current_sequence_value
FROM public.churches;
