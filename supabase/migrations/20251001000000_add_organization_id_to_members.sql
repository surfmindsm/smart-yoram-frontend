-- Add organization_id column to members table
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS organization_id uuid NULL;

-- Add foreign key constraint
ALTER TABLE public.members
ADD CONSTRAINT members_organization_id_fkey
FOREIGN KEY (organization_id)
REFERENCES public.church_organizations (id)
ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_members_organization_id
ON public.members USING btree (organization_id);

-- Add comment
COMMENT ON COLUMN public.members.organization_id IS '교인이 속한 조직 ID (church_organizations 테이블 참조)';
