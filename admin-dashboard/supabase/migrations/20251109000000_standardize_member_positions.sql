-- 교인 직분(Position) 표준화 마이그레이션
-- 목적: 한글 직분을 영문 코드로 표준화하여 데이터 일관성 확보

-- 1. 기존 한글 직분을 영문 코드로 변환
UPDATE public.members
SET position = CASE position
  -- 교역자 계열
  WHEN '목사' THEN 'PASTOR'
  WHEN '전도사' THEN 'EVANGELIST'
  WHEN '교육전도사' THEN 'EDUCATION_EVANGELIST'

  -- 장로 계열
  WHEN '장로' THEN 'ELDER'
  WHEN '은퇴장로' THEN 'RETIRED_ELDER'

  -- 권사 계열
  WHEN '권사' THEN 'DEACONESS'
  WHEN '은퇴권사' THEN 'RETIRED_DEACONESS'

  -- 집사 계열
  WHEN '집사' THEN 'DEACON'
  WHEN '안수집사' THEN 'ORDAINED_DEACON'

  -- 교사 계열
  WHEN '교사' THEN 'TEACHER'

  -- 기타
  WHEN '부장' THEN 'DIRECTOR'
  WHEN '회장' THEN 'PRESIDENT'
  WHEN '성도' THEN 'MEMBER'
  WHEN 'member' THEN 'MEMBER'
  WHEN '교역자' THEN 'CLERGY' -- 일반 교역자

  -- 기본값
  ELSE 'MEMBER'
END
WHERE position IS NOT NULL;

-- 2. NULL 값을 기본값으로 설정
UPDATE public.members
SET position = 'MEMBER'
WHERE position IS NULL;

-- 3. position 컬럼의 기본값을 'MEMBER'로 변경
ALTER TABLE public.members
ALTER COLUMN position SET DEFAULT 'MEMBER';

-- 4. position 값 검증을 위한 CHECK 제약조건 추가 (선택사항)
-- ALTER TABLE public.members
-- ADD CONSTRAINT check_valid_position CHECK (
--   position IN (
--     'PASTOR', 'EVANGELIST', 'EDUCATION_EVANGELIST', 'CLERGY',
--     'ELDER', 'RETIRED_ELDER',
--     'DEACONESS', 'RETIRED_DEACONESS',
--     'DEACON', 'ORDAINED_DEACON',
--     'TEACHER',
--     'DIRECTOR', 'PRESIDENT',
--     'MEMBER'
--   )
-- );

-- 5. position 값에 대한 주석 추가
COMMENT ON COLUMN public.members.position IS '교인 직분 (영문 코드): PASTOR(목사), EVANGELIST(전도사), ELDER(장로), DEACONESS(권사), DEACON(집사), TEACHER(교사), MEMBER(성도) 등';

-- 6. 인덱스 최적화 (position 기반 필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_members_position ON public.members(position);
CREATE INDEX IF NOT EXISTS idx_members_position_age ON public.members(position, birth_date);

-- 7. position_category 계산을 위한 함수 생성 (주소록 탭 필터링용)
CREATE OR REPLACE FUNCTION get_position_category(
  p_position VARCHAR,
  p_birth_date DATE
)
RETURNS VARCHAR
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  age INTEGER;
  category VARCHAR;
BEGIN
  -- 연령 계산
  IF p_birth_date IS NOT NULL THEN
    age := DATE_PART('year', AGE(CURRENT_DATE, p_birth_date));
  ELSE
    age := NULL;
  END IF;

  -- 카테고리 결정 (우선순위: 직분 > 연령대)
  CASE
    -- 교역자 계열 (목사, 전도사 등)
    WHEN p_position IN ('PASTOR', 'EVANGELIST', 'EDUCATION_EVANGELIST', 'CLERGY') THEN
      category := 'CLERGY'; -- 교역자

    -- 장로
    WHEN p_position IN ('ELDER', 'RETIRED_ELDER') THEN
      category := 'ELDER'; -- 장로

    -- 권사
    WHEN p_position IN ('DEACONESS', 'RETIRED_DEACONESS') THEN
      category := 'DEACONESS'; -- 권사

    -- 집사
    WHEN p_position IN ('DEACON', 'ORDAINED_DEACON') THEN
      category := 'DEACON'; -- 집사

    -- 연령대 기반 (직분이 MEMBER이거나 TEACHER인 경우)
    WHEN age IS NOT NULL AND age <= 19 THEN
      category := 'CHILDREN'; -- 교회학교 (0-19세)

    WHEN age IS NOT NULL AND age >= 20 AND age <= 35 THEN
      category := 'YOUTH'; -- 청년 (20-35세)

    -- 기본값: 성도
    ELSE
      category := 'MEMBER'; -- 성도
  END CASE;

  RETURN category;
END;
$$;

-- 8. 함수 주석
COMMENT ON FUNCTION get_position_category IS '교인의 주소록 카테고리를 반환: CLERGY(교역자), ELDER(장로), DEACONESS(권사), DEACON(집사), YOUTH(청년), CHILDREN(교회학교), MEMBER(성도)';
