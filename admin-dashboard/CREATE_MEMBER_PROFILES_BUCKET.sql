-- member-profiles 버킷 생성 및 RLS 정책 설정
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-profiles',
  'member-profiles',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. 공개 읽기 정책
CREATE POLICY "Public can read member profiles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'member-profiles');

-- 3. 누구나 업로드 가능
CREATE POLICY "Anyone can upload to member profiles"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'member-profiles');

-- 4. 누구나 업데이트 가능
CREATE POLICY "Anyone can update member profiles"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'member-profiles');

-- 5. 누구나 삭제 가능
CREATE POLICY "Anyone can delete member profiles"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'member-profiles');

-- 확인: 버킷 생성 확인
SELECT * FROM storage.buckets WHERE id = 'member-profiles';

-- 확인: 정책 확인
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects' AND qual LIKE '%member-profiles%';
