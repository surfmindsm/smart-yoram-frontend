-- Create accounting-receipts storage bucket for receipt attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'accounting-receipts',
  'accounting-receipts',
  true,
  10485760,  -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload receipts
CREATE POLICY IF NOT EXISTS "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'accounting-receipts');

-- Allow public read access to receipts
CREATE POLICY IF NOT EXISTS "Public can view receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'accounting-receipts');

-- Allow authenticated users to update their receipts
CREATE POLICY IF NOT EXISTS "Authenticated users can update receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'accounting-receipts')
WITH CHECK (bucket_id = 'accounting-receipts');

-- Allow authenticated users to delete receipts
CREATE POLICY IF NOT EXISTS "Authenticated users can delete receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'accounting-receipts');
