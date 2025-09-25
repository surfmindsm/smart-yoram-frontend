-- Add serial_id column to churches table
ALTER TABLE public.churches
ADD COLUMN serial_id SERIAL UNIQUE;

-- Update existing churches with sequential values based on creation date
UPDATE public.churches
SET serial_id = subquery.row_num
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at, id) as row_num
  FROM public.churches
) as subquery
WHERE public.churches.id = subquery.id;

-- Make serial_id NOT NULL for future records
ALTER TABLE public.churches
ALTER COLUMN serial_id SET NOT NULL;

-- Create a function to get church by serial_id
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
    c.pastor_name,
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

-- Verify the results
SELECT
  serial_id,
  name,
  subscription_status,
  subscription_plan,
  member_limit,
  created_at
FROM public.churches
ORDER BY serial_id;