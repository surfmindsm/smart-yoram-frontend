-- offerings 테이블의 member_id를 nullable로 변경
-- 무명 헌금을 지원하기 위함

-- member_id를 nullable로 변경
ALTER TABLE public.offerings
ALTER COLUMN member_id DROP NOT NULL;

-- 인덱스 추가 (member_id가 null인 헌금 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_offerings_member_id_null
ON public.offerings (church_id, offered_on)
WHERE member_id IS NULL;

-- 코멘트 추가
COMMENT ON COLUMN public.offerings.member_id IS 'Member ID - NULL for anonymous offerings (무명 헌금)';
