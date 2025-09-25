-- 🛡️ SAFER VERSION: Step-by-step migration with rollback safety

-- Step 1: Add serial_id column (safe - doesn't affect existing data)
ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS serial_id SERIAL;

-- Step 2: Create unique index (safe - ensures data integrity)
CREATE UNIQUE INDEX IF NOT EXISTS churches_serial_id_unique
ON public.churches (serial_id);

-- Step 3: Update existing churches with sequential values (safe)
UPDATE public.churches
SET serial_id = subquery.row_num
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at, id) as row_num
  FROM public.churches
  WHERE serial_id IS NULL  -- Only update records without serial_id
) as subquery
WHERE public.churches.id = subquery.id;

-- Step 4: Verify all churches have serial_id before making it NOT NULL
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM public.churches
    WHERE serial_id IS NULL;

    IF null_count > 0 THEN
        RAISE EXCEPTION 'Found % churches without serial_id. Aborting NOT NULL constraint.', null_count;
    ELSE
        ALTER TABLE public.churches ALTER COLUMN serial_id SET NOT NULL;
        RAISE NOTICE 'Successfully set serial_id as NOT NULL';
    END IF;
END $$;

-- Step 5: Create helper function (safe - new functionality)
CREATE OR REPLACE FUNCTION get_church_by_serial_id(church_serial_id integer)
RETURNS TABLE (
  id uuid,
  serial_id integer,
  name character varying,
  address text,
  phone character varying,
  email character varying,
  pastor_name character varying,
  subscription_status character varying,
  subscription_end_date timestamp without time zone,
  member_limit integer,
  is_active boolean,
  subscription_plan character varying,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.serial_id,
    c.name,
    c.address,
    c.phone,
    c.email,
    c.pastor_name,
    c.subscription_status,
    c.subscription_end_date,
    c.member_limit,
    c.is_active,
    c.subscription_plan,
    c.created_at,
    c.updated_at
  FROM public.churches c
  WHERE c.serial_id = church_serial_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Verify the migration
SELECT
  serial_id,
  name,
  subscription_status,
  subscription_plan,
  created_at,
  'SUCCESS' as migration_status
FROM public.churches
ORDER BY serial_id;