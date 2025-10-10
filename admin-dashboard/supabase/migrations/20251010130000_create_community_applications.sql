-- community_applications 테이블 생성
CREATE TABLE IF NOT EXISTS community_applications (
  id BIGSERIAL PRIMARY KEY,

  -- 필수 필드
  applicant_type TEXT NOT NULL CHECK (applicant_type IN ('company', 'individual', 'musician', 'minister', 'organization', 'church_admin', 'other')),
  organization_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT NOT NULL,

  -- 약관 동의
  agree_terms BOOLEAN NOT NULL DEFAULT false,
  agree_privacy BOOLEAN NOT NULL DEFAULT false,
  agree_marketing BOOLEAN DEFAULT false,

  -- 선택 필드
  business_number TEXT,
  address TEXT,
  service_area TEXT,
  website TEXT,

  -- 첨부파일 (JSON 배열로 저장)
  attachments JSONB DEFAULT '[]'::jsonb,

  -- 신청 상태
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- 승인/반려 정보
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by INTEGER,
  rejection_reason TEXT,
  notes TEXT,

  -- 시스템 필드
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_community_applications_status ON community_applications(status);
CREATE INDEX IF NOT EXISTS idx_community_applications_email ON community_applications(email);
CREATE INDEX IF NOT EXISTS idx_community_applications_submitted_at ON community_applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_applications_applicant_type ON community_applications(applicant_type);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_community_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_community_applications_updated_at ON community_applications;

CREATE TRIGGER trigger_update_community_applications_updated_at
  BEFORE UPDATE ON community_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_community_applications_updated_at();

-- RLS 활성화
ALTER TABLE community_applications ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 삭제
DROP POLICY IF EXISTS "Anyone can insert community applications" ON community_applications;
DROP POLICY IF EXISTS "Authenticated users can view community applications" ON community_applications;
DROP POLICY IF EXISTS "Authenticated users can update community applications" ON community_applications;

-- 누구나 신청서를 제출할 수 있도록 INSERT 정책 생성
CREATE POLICY "Anyone can insert community applications"
ON community_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- SELECT 정책 추가 (인증된 사용자만 조회 가능)
CREATE POLICY "Authenticated users can view community applications"
ON community_applications
FOR SELECT
TO authenticated
USING (true);

-- UPDATE 정책 추가 (인증된 사용자만 수정 가능)
CREATE POLICY "Authenticated users can update community applications"
ON community_applications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
