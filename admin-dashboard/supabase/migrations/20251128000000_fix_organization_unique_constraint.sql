-- Fix organization name uniqueness constraint
-- Allow same name in different parent organizations
-- Example: Both "1교구 > 2구역" and "2교구 > 2구역" should be allowed

-- Drop the old constraint
ALTER TABLE public.church_organizations
DROP CONSTRAINT IF EXISTS church_organizations_church_id_name_key;

-- Add new constraint: unique within same parent
-- Use COALESCE to handle NULL parent_id (top-level organizations)
ALTER TABLE public.church_organizations
ADD CONSTRAINT church_organizations_unique_name_per_parent
UNIQUE (church_id, COALESCE(parent_id::text, 'ROOT'), name);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT church_organizations_unique_name_per_parent
ON public.church_organizations
IS '같은 부모 조직 아래에서 조직명 중복 방지. 다른 부모 아래에서는 같은 이름 허용.';
