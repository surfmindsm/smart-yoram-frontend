-- Update churches table to match the enhanced schema with subscription and GPT fields
-- This migration aligns the existing churches table with the provided schema

-- First, let's alter the existing churches table to add missing columns
ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS subscription_status character varying DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_end_date timestamp without time zone,
ADD COLUMN IF NOT EXISTS member_limit integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS subscription_plan character varying(50),
ADD COLUMN IF NOT EXISTS gpt_api_key text,
ADD COLUMN IF NOT EXISTS gpt_model character varying(50) DEFAULT 'gpt-4o-mini',
ADD COLUMN IF NOT EXISTS max_tokens integer,
ADD COLUMN IF NOT EXISTS temperature double precision,
ADD COLUMN IF NOT EXISTS gpt_last_test timestamp without time zone,
ADD COLUMN IF NOT EXISTS max_agents integer,
ADD COLUMN IF NOT EXISTS monthly_token_limit integer,
ADD COLUMN IF NOT EXISTS current_month_tokens integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_month_cost double precision DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS business_no character varying,
ADD COLUMN IF NOT EXISTS rrn_encrypted character varying,
ADD COLUMN IF NOT EXISTS district_scheme character varying;

-- Also keep the existing UUID-based ID system and add the serial id as a secondary identifier
ALTER TABLE public.churches
ADD COLUMN IF NOT EXISTS serial_id serial UNIQUE;

-- Create index on the new serial_id field if it doesn't exist
CREATE INDEX IF NOT EXISTS ix_churches_serial_id ON public.churches USING btree (serial_id);

-- Update any existing churches to have proper default values
UPDATE public.churches
SET
  subscription_status = COALESCE(subscription_status, 'active'),
  member_limit = COALESCE(member_limit, 100),
  is_active = COALESCE(is_active, true),
  gpt_model = COALESCE(gpt_model, 'gpt-4o-mini'),
  current_month_tokens = COALESCE(current_month_tokens, 0),
  current_month_cost = COALESCE(current_month_cost, 0.0)
WHERE subscription_status IS NULL
   OR member_limit IS NULL
   OR is_active IS NULL
   OR gpt_model IS NULL
   OR current_month_tokens IS NULL
   OR current_month_cost IS NULL;

-- Create a function to get church by serial_id (for API compatibility)
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

-- Create a default church with serial_id 1 for development/testing
INSERT INTO public.churches (
  id,
  name,
  address,
  phone,
  email,
  pastor_name,
  subscription_status,
  subscription_end_date,
  member_limit,
  is_active,
  subscription_plan,
  gpt_model,
  current_month_tokens,
  current_month_cost
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '스마트 요람 교회',
  '서울특별시 강남구 테헤란로 123',
  '02-1234-5678',
  'admin@smartyoram.church',
  '김목사',
  'active',
  NOW() + INTERVAL '1 year',
  1000,
  true,
  'premium',
  'gpt-4o-mini',
  0,
  0.0
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  pastor_name = EXCLUDED.pastor_name,
  subscription_status = EXCLUDED.subscription_status,
  subscription_end_date = EXCLUDED.subscription_end_date,
  member_limit = EXCLUDED.member_limit,
  is_active = EXCLUDED.is_active,
  subscription_plan = EXCLUDED.subscription_plan,
  gpt_model = EXCLUDED.gpt_model,
  current_month_tokens = EXCLUDED.current_month_tokens,
  current_month_cost = EXCLUDED.current_month_cost;