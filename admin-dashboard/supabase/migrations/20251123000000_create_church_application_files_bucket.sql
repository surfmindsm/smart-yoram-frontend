-- Create church-application-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'church-application-files',
  'church-application-files',
  true, -- Public bucket for easy access
  10485760, -- 10MB file size limit
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload files (authenticated and anonymous)
CREATE POLICY "Anyone can upload church application files"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'church-application-files');

-- Allow anyone to read files
CREATE POLICY "Anyone can read church application files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'church-application-files');

-- Allow authenticated users to delete files (for cleanup)
CREATE POLICY "Authenticated users can delete church application files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'church-application-files');
