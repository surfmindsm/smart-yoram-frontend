-- member-profiles 버킷 생성 및 공개 접근 허용
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. 버킷 생성 (이미 있으면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'member-profiles',
  'member-profiles',
  true,  -- 공개 버킷으로 설정
  5242880, -- 5MB 제한
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Public read access for member profiles" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload member profiles" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update member profiles" ON storage.objects;
DROP POLICY IF NOT EXISTS "Authenticated users can delete member profiles" ON storage.objects;

-- 3. 새로운 정책 생성 - 공개 읽기
CREATE POLICY "Public can read member profiles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'member-profiles');

-- 4. 익명 사용자 포함 모든 사용자 업로드 허용 (임시 토큰 사용자 포함)
CREATE POLICY "Anyone can upload member profiles"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'member-profiles');

-- 5. 익명 사용자 포함 모든 사용자 업데이트 허용
CREATE POLICY "Anyone can update member profiles"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'member-profiles');

-- 6. 인증된 사용자만 삭제 가능
CREATE POLICY "Authenticated users can delete member profiles"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'member-profiles');
