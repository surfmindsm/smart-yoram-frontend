-- Add extended member fields to support full member management
-- 교인 관리를 위한 확장 필드 추가

-- 직업 정보 확장
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS job_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS job_detail VARCHAR(255),
ADD COLUMN IF NOT EXISTS job_position VARCHAR(100),
ADD COLUMN IF NOT EXISTS job_title VARCHAR(100);

-- 교회 정보 확장
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS member_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS confirmation_date DATE,
ADD COLUMN IF NOT EXISTS sub_district VARCHAR(100),
ADD COLUMN IF NOT EXISTS age_group VARCHAR(50);

-- 지역 정보
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS region_1 VARCHAR(100),
ADD COLUMN IF NOT EXISTS region_2 VARCHAR(100),
ADD COLUMN IF NOT EXISTS region_3 VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- 신앙 및 연락 정보
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS spiritual_grade VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_contact_date DATE;

-- 사역 정보 확장
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS ministry_start_date DATE,
ADD COLUMN IF NOT EXISTS neighboring_church VARCHAR(255),
ADD COLUMN IF NOT EXISTS position_decision VARCHAR(255),
ADD COLUMN IF NOT EXISTS daily_activity TEXT;

-- 자유 필드 (커스터마이징 가능한 12개 필드)
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS custom_field_1 TEXT,
ADD COLUMN IF NOT EXISTS custom_field_2 TEXT,
ADD COLUMN IF NOT EXISTS custom_field_3 TEXT,
ADD COLUMN IF NOT EXISTS custom_field_4 TEXT,
ADD COLUMN IF NOT EXISTS custom_field_5 TEXT,
ADD COLUMN IF NOT EXISTS custom_field_6 TEXT,
ADD COLUMN IF NOT EXISTS custom_field_7 TEXT,
ADD COLUMN IF NOT EXISTS custom_field_8 TEXT,
ADD COLUMN IF NOT EXISTS custom_field_9 TEXT,
ADD COLUMN IF NOT EXISTS custom_field_10 TEXT,
ADD COLUMN IF NOT EXISTS custom_field_11 TEXT,
ADD COLUMN IF NOT EXISTS custom_field_12 TEXT;

-- 특별 사항
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS special_notes TEXT;

-- 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_members_job_category ON public.members(job_category);
CREATE INDEX IF NOT EXISTS idx_members_member_type ON public.members(member_type);
CREATE INDEX IF NOT EXISTS idx_members_age_group ON public.members(age_group);
CREATE INDEX IF NOT EXISTS idx_members_spiritual_grade ON public.members(spiritual_grade);
CREATE INDEX IF NOT EXISTS idx_members_region_1 ON public.members(region_1);
CREATE INDEX IF NOT EXISTS idx_members_region_2 ON public.members(region_2);
CREATE INDEX IF NOT EXISTS idx_members_postal_code ON public.members(postal_code);

-- 코멘트 추가 (필드 설명)
COMMENT ON COLUMN public.members.job_category IS '직업 분류 (사무직, 교육직, 의료진 등)';
COMMENT ON COLUMN public.members.job_detail IS '구체적인 업무 내용';
COMMENT ON COLUMN public.members.job_position IS '직책/직위 (팀장, 과장 등)';
COMMENT ON COLUMN public.members.job_title IS '직업명';

COMMENT ON COLUMN public.members.member_type IS '교인 구분 (정교인, 학습교인, 세례교인, 방문자)';
COMMENT ON COLUMN public.members.confirmation_date IS '입교일';
COMMENT ON COLUMN public.members.sub_district IS '소구역';
COMMENT ON COLUMN public.members.age_group IS '나이 그룹';

COMMENT ON COLUMN public.members.region_1 IS '지역 1 (시/도)';
COMMENT ON COLUMN public.members.region_2 IS '지역 2 (구/군)';
COMMENT ON COLUMN public.members.region_3 IS '지역 3 (동)';
COMMENT ON COLUMN public.members.postal_code IS '우편번호';

COMMENT ON COLUMN public.members.spiritual_grade IS '신급 (초신자, B급, A급, 리더)';
COMMENT ON COLUMN public.members.last_contact_date IS '마지막 연락일';

COMMENT ON COLUMN public.members.ministry_start_date IS '사역 시작일';
COMMENT ON COLUMN public.members.neighboring_church IS '이웃 교회';
COMMENT ON COLUMN public.members.position_decision IS '직분 결정 내용';
COMMENT ON COLUMN public.members.daily_activity IS '일상 활동 및 사역 내용';

COMMENT ON COLUMN public.members.custom_field_1 IS '자유 필드 1 (교회별 커스터마이징 가능)';
COMMENT ON COLUMN public.members.custom_field_2 IS '자유 필드 2';
COMMENT ON COLUMN public.members.custom_field_3 IS '자유 필드 3';
COMMENT ON COLUMN public.members.custom_field_4 IS '자유 필드 4';
COMMENT ON COLUMN public.members.custom_field_5 IS '자유 필드 5';
COMMENT ON COLUMN public.members.custom_field_6 IS '자유 필드 6';
COMMENT ON COLUMN public.members.custom_field_7 IS '자유 필드 7';
COMMENT ON COLUMN public.members.custom_field_8 IS '자유 필드 8';
COMMENT ON COLUMN public.members.custom_field_9 IS '자유 필드 9';
COMMENT ON COLUMN public.members.custom_field_10 IS '자유 필드 10';
COMMENT ON COLUMN public.members.custom_field_11 IS '자유 필드 11';
COMMENT ON COLUMN public.members.custom_field_12 IS '자유 필드 12';

COMMENT ON COLUMN public.members.special_notes IS '개인 특별사항 (건강, 가족관계 등)';
