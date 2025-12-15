-- Create member-profiles storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-profiles',
  'member-profiles',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for member-profiles bucket
CREATE POLICY IF NOT EXISTS "Public read access for member profiles"
ON storage.objects FOR SELECT
USING (bucket_id = 'member-profiles');

-- Allow authenticated users to upload member profile photos
CREATE POLICY IF NOT EXISTS "Authenticated users can upload member profiles"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'member-profiles' AND auth.role() = 'authenticated');

-- Allow authenticated users to update member profile photos
CREATE POLICY IF NOT EXISTS "Authenticated users can update member profiles"
ON storage.objects FOR UPDATE
USING (bucket_id = 'member-profiles' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete member profile photos
CREATE POLICY IF NOT EXISTS "Authenticated users can delete member profiles"
ON storage.objects FOR DELETE
USING (bucket_id = 'member-profiles' AND auth.role() = 'authenticated');
