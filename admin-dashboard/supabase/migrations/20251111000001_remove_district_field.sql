-- Remove district column from members table
-- 교구/지역 필드를 members 테이블에서 제거합니다

-- Remove index if exists
DROP INDEX IF EXISTS idx_members_district;

-- Remove column
ALTER TABLE public.members
DROP COLUMN IF EXISTS district;
