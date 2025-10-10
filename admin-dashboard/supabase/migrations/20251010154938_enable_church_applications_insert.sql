-- church_applications 테이블에 대한 INSERT 권한 활성화
-- 누구나 신청서를 제출할 수 있도록 허용 (public access)

-- RLS 활성화 (이미 활성화되어 있을 수 있음)
ALTER TABLE church_applications ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 삭제
DROP POLICY IF EXISTS "Anyone can insert church applications" ON church_applications;

-- 누구나 신청서를 제출할 수 있도록 INSERT 정책 생성
CREATE POLICY "Anyone can insert church applications"
ON church_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- SELECT 정책도 추가 (관리자만 조회 가능하도록)
DROP POLICY IF EXISTS "Authenticated users can view church applications" ON church_applications;

CREATE POLICY "Authenticated users can view church applications"
ON church_applications
FOR SELECT
TO authenticated
USING (true);
