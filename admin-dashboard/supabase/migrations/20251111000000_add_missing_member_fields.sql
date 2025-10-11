-- Add missing fields to members table
-- 이 마이그레이션은 교인 테이블에 누락된 필드들을 추가합니다

-- 교회 정보 필드
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS appointed_on DATE,
ADD COLUMN IF NOT EXISTS ordination_church VARCHAR(255);

-- 직장 정보 필드
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS workplace VARCHAR(255),
ADD COLUMN IF NOT EXISTS workplace_phone VARCHAR(50);

-- 가족 정보 필드
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS married_on DATE;

-- 인도자 정보 필드 (외래 키)
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS inviter3_member_id INTEGER REFERENCES public.members(id) ON DELETE SET NULL;

-- 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_members_inviter3 ON public.members(inviter3_member_id);
CREATE INDEX IF NOT EXISTS idx_members_appointed_on ON public.members(appointed_on);
CREATE INDEX IF NOT EXISTS idx_members_married_on ON public.members(married_on);

-- 코멘트 추가
COMMENT ON COLUMN public.members.appointed_on IS '직분 임명일';
COMMENT ON COLUMN public.members.ordination_church IS '안수받은 교회';
COMMENT ON COLUMN public.members.workplace IS '직장명';
COMMENT ON COLUMN public.members.workplace_phone IS '직장 전화번호';
COMMENT ON COLUMN public.members.spouse_name IS '배우자 이름';
COMMENT ON COLUMN public.members.married_on IS '결혼일';
COMMENT ON COLUMN public.members.inviter3_member_id IS '이 교인을 전도하거나 인도한 교인의 ID';
