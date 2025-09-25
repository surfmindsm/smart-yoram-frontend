-- Fix missing serial_id values in churches table
-- This migration ensures all existing churches have proper serial_id values

-- First, let's update existing churches that don't have serial_id values
-- We'll assign serial_id based on the order of creation
WITH numbered_churches AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at, id) as row_num
  FROM public.churches
  WHERE serial_id IS NULL
)
UPDATE public.churches
SET serial_id = numbered_churches.row_num
FROM numbered_churches
WHERE public.churches.id = numbered_churches.id;

-- Ensure the serial sequence is properly set for future inserts
-- Find the maximum serial_id and set the sequence accordingly
DO $$
DECLARE
    max_serial_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(serial_id), 0) INTO max_serial_id FROM public.churches;

    -- Reset the serial sequence to start from the next number
    PERFORM setval(pg_get_serial_sequence('public.churches', 'serial_id'), max_serial_id + 1, false);
END $$;

-- Add a constraint to ensure serial_id is never null for future inserts
ALTER TABLE public.churches
ALTER COLUMN serial_id SET NOT NULL;

-- Create a unique index on serial_id if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS churches_serial_id_unique
ON public.churches (serial_id);

-- Update the existing function to handle serial_id properly
CREATE OR REPLACE FUNCTION get_church_by_serial_id(church_serial_id integer)
RETURNS TABLE (
  id uuid,
  serial_id integer,
  name character varying,
  address text,
  phone character varying,
  email character varying,
  website text,
  pastor_name character varying,
  established_date date,
  denomination character varying,
  description text,
  logo_url text,
  subscription_status character varying,
  subscription_end_date timestamp without time zone,
  member_limit integer,
  is_active boolean,
  subscription_plan character varying,
  gpt_api_key text,
  gpt_model character varying,
  max_tokens integer,
  temperature double precision,
  gpt_last_test timestamp without time zone,
  max_agents integer,
  monthly_token_limit integer,
  current_month_tokens integer,
  current_month_cost double precision,
  business_no character varying,
  rrn_encrypted character varying,
  district_scheme character varying,
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
    c.website,
    c.pastor_name,
    c.established_date,
    c.denomination,
    c.description,
    c.logo_url,
    c.subscription_status,
    c.subscription_end_date,
    c.member_limit,
    c.is_active,
    c.subscription_plan,
    c.gpt_api_key,
    c.gpt_model,
    c.max_tokens,
    c.temperature,
    c.gpt_last_test,
    c.max_agents,
    c.monthly_token_limit,
    c.current_month_tokens,
    c.current_month_cost,
    c.business_no,
    c.rrn_encrypted,
    c.district_scheme,
    c.created_at,
    c.updated_at
  FROM public.churches c
  WHERE c.serial_id = church_serial_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Display the updated churches for verification
SELECT
  serial_id,
  name,
  subscription_status,
  subscription_plan,
  member_limit,
  created_at
FROM public.churches
ORDER BY serial_id;