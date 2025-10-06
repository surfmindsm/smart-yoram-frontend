-- Add foreign key constraints to community_sharing table for JOIN support

-- Add foreign key for church_id referencing churches table
ALTER TABLE public.community_sharing
ADD CONSTRAINT community_sharing_church_id_fkey
FOREIGN KEY (church_id) REFERENCES public.churches(id)
ON DELETE SET DEFAULT;

-- Add foreign key for author_id referencing users table
ALTER TABLE public.community_sharing
ADD CONSTRAINT community_sharing_author_id_fkey
FOREIGN KEY (author_id) REFERENCES public.users(id)
ON DELETE SET NULL;

-- Add additional fields for better data management
ALTER TABLE public.community_sharing
ADD COLUMN IF NOT EXISTS contact_phone character varying(20),
ADD COLUMN IF NOT EXISTS contact_email character varying(100),
ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1;

-- Update RLS policy to allow anonymous read for Edge Functions
DROP POLICY IF EXISTS "Anyone can view active sharing posts" ON public.community_sharing;

CREATE POLICY "Anyone can view active sharing posts" ON public.community_sharing
  FOR SELECT USING (status = 'active' OR status IS NULL);

-- Create policy for service role to bypass RLS (for Edge Functions)
CREATE POLICY "Service role can manage all sharing posts" ON public.community_sharing
  FOR ALL USING (auth.role() = 'service_role');
