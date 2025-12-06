-- church_applications 테이블에 admin_phone 컬럼 추가
ALTER TABLE church_applications
ADD COLUMN admin_phone TEXT;

-- 컬럼 추가 확인을 위한 코멘트
COMMENT ON COLUMN church_applications.admin_phone IS '계정 사용자 연락처 (교회 관리자 휴대폰 번호)';
