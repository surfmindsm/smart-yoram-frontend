-- member-profiles 버킷 RLS 정책 수정
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. 기존 정책 확인 및 삭제
DROP POLICY IF EXISTS "Public read access for member profiles" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload member profiles" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update member profiles" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete member profiles" ON storage.objects;

-- 2. 새로운 정책 - 공개 읽기
CREATE POLICY "Public can read member profiles"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'member-profiles');

-- 3. 누구나 업로드 가능 (임시 토큰 사용자 포함)
CREATE POLICY "Anyone can upload to member profiles"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'member-profiles');

-- 4. 누구나 업데이트 가능
CREATE POLICY "Anyone can update member profiles"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'member-profiles');

-- 5. 누구나 삭제 가능 (또는 authenticated만 허용)
CREATE POLICY "Anyone can delete member profiles"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'member-profiles');

-- 확인: 현재 정책 목록 조회
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND qual LIKE '%member-profiles%';
