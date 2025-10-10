-- church_applications 테이블에 processed_at 컬럼 추가
ALTER TABLE church_applications
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- 기존 reviewed_at 데이터가 있으면 processed_at으로 복사
UPDATE church_applications
SET processed_at = reviewed_at
WHERE reviewed_at IS NOT NULL AND processed_at IS NULL;
