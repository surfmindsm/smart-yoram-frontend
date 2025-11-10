-- 교인 직분 2단계 계층 구조 추가
-- 목적: position_main (대분류) + position_detail (세부 직분) 구조로 확장

-- 1. position_detail 컬럼 추가
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS position_detail VARCHAR(50);

-- 2. position 컬럼명을 position_main으로 변경
ALTER TABLE public.members
RENAME COLUMN position TO position_main;

-- 3. 기존 데이터 마이그레이션: position_main -> position_main + position_detail
-- 기존 단일 직분을 2단계로 분리

UPDATE public.members
SET
  position_main = CASE
    -- 교역자 계열 -> CLERGY
    WHEN position_main IN ('PASTOR', 'EVANGELIST', 'EDUCATION_EVANGELIST', 'CLERGY') THEN 'CLERGY'
    -- 장로 계열 -> ELDER
    WHEN position_main IN ('ELDER', 'RETIRED_ELDER') THEN 'ELDER'
    -- 권사 계열 -> DEACONESS
    WHEN position_main IN ('DEACONESS', 'RETIRED_DEACONESS') THEN 'DEACONESS'
    -- 집사 계열 -> DEACON
    WHEN position_main IN ('DEACON', 'ORDAINED_DEACON') THEN 'DEACON'
    -- 기타 -> MEMBER
    WHEN position_main IN ('TEACHER', 'DIRECTOR', 'PRESIDENT') THEN 'MEMBER'
    -- 기본값
    ELSE 'MEMBER'
  END,
  position_detail = CASE
    -- 교역자 세부
    WHEN position_main = 'PASTOR' THEN 'SENIOR_PASTOR'
    WHEN position_main = 'EVANGELIST' THEN 'EVANGELIST'
    WHEN position_main = 'EDUCATION_EVANGELIST' THEN 'EDUCATION_EVANGELIST'
    WHEN position_main = 'CLERGY' THEN 'CLERGY'

    -- 장로 세부
    WHEN position_main = 'ELDER' THEN 'ACTIVE_ELDER'
    WHEN position_main = 'RETIRED_ELDER' THEN 'EMERITUS_ELDER'

    -- 권사 세부
    WHEN position_main = 'DEACONESS' THEN 'ACTIVE_DEACONESS'
    WHEN position_main = 'RETIRED_DEACONESS' THEN 'EMERITUS_DEACONESS'

    -- 집사 세부
    WHEN position_main = 'DEACON' THEN 'ACTIVE_DEACON'
    WHEN position_main = 'ORDAINED_DEACON' THEN 'ORDAINED_DEACON'

    -- 기타
    WHEN position_main = 'TEACHER' THEN 'TEACHER'
    WHEN position_main = 'DIRECTOR' THEN 'DIRECTOR'
    WHEN position_main = 'PRESIDENT' THEN 'PRESIDENT'

    -- 기본값
    ELSE NULL
  END
WHERE position_main IS NOT NULL;

-- 4. position_main 기본값 설정
ALTER TABLE public.members
ALTER COLUMN position_main SET DEFAULT 'MEMBER';

-- 5. 컬럼 주석 추가
COMMENT ON COLUMN public.members.position_main IS '직분 대분류: CLERGY(교역자), ELDER(장로), DEACONESS(권사), DEACON(집사), MEMBER(성도)';
COMMENT ON COLUMN public.members.position_detail IS '직분 세부: SENIOR_PASTOR(담임목사), EMERITUS_ELDER(원로장로), HONORARY_DEACONESS(명예권사) 등';

-- 6. 인덱스 생성 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_members_position_main ON public.members(position_main);
CREATE INDEX IF NOT EXISTS idx_members_position_detail ON public.members(position_detail);
CREATE INDEX IF NOT EXISTS idx_members_position_main_detail ON public.members(position_main, position_detail);

-- 7. get_position_category 함수 업데이트 (position_main 사용)
DROP FUNCTION IF EXISTS get_position_category(VARCHAR, DATE);

CREATE OR REPLACE FUNCTION get_position_category(
  p_position_main VARCHAR,
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
    -- 교역자 (CLERGY)
    WHEN p_position_main = 'CLERGY' THEN
      category := 'CLERGY';

    -- 장로 (ELDER)
    WHEN p_position_main = 'ELDER' THEN
      category := 'ELDER';

    -- 권사 (DEACONESS)
    WHEN p_position_main = 'DEACONESS' THEN
      category := 'DEACONESS';

    -- 집사 (DEACON)
    WHEN p_position_main = 'DEACON' THEN
      category := 'DEACON';

    -- 연령대 기반 (직분이 MEMBER인 경우)
    WHEN age IS NOT NULL AND age <= 19 THEN
      category := 'CHILDREN'; -- 교회학교 (0-19세)

    WHEN age IS NOT NULL AND age >= 20 AND age <= 35 THEN
      category := 'YOUTH'; -- 청년 (20-35세)

    -- 기본값: 성도
    ELSE
      category := 'MEMBER';
  END CASE;

  RETURN category;
END;
$$;

COMMENT ON FUNCTION get_position_category IS '교인의 주소록 카테고리를 반환: CLERGY(교역자), ELDER(장로), DEACONESS(권사), DEACON(집사), YOUTH(청년), CHILDREN(교회학교), MEMBER(성도)';

-- 8. 직분 상세 매핑 뷰 생성 (한글 레이블 조회용)
CREATE OR REPLACE VIEW v_members_with_position_labels AS
SELECT
  m.*,
  CASE m.position_main
    WHEN 'CLERGY' THEN '교역자'
    WHEN 'ELDER' THEN '장로'
    WHEN 'DEACONESS' THEN '권사'
    WHEN 'DEACON' THEN '집사'
    WHEN 'MEMBER' THEN '성도'
    ELSE '성도'
  END AS position_main_label,
  CASE m.position_detail
    -- 교역자 세부
    WHEN 'SENIOR_PASTOR' THEN '담임목사'
    WHEN 'EMERITUS_PASTOR' THEN '원로목사'
    WHEN 'ASSOCIATE_PASTOR' THEN '부목사'
    WHEN 'COOPERATE_PASTOR' THEN '협동목사'
    WHEN 'EVANGELIST' THEN '전도사'
    WHEN 'INTERN_EVANGELIST' THEN '전임전도사'
    WHEN 'EDUCATION_EVANGELIST' THEN '교육담당전도사'

    -- 장로 세부
    WHEN 'ACTIVE_ELDER' THEN '시무장로'
    WHEN 'EMERITUS_ELDER' THEN '원로장로'
    WHEN 'TRANSFERRED_EMERITUS_ELDER' THEN '이명은퇴장로'

    -- 권사 세부
    WHEN 'HONORARY_DEACONESS' THEN '명예권사'
    WHEN 'ACTIVE_DEACONESS' THEN '시무권사'

    -- 집사 세부
    WHEN 'HONORARY_DEACON' THEN '명예집사'
    WHEN 'PROBATIONARY_DEACON' THEN '서리집사'
    WHEN 'ACTIVE_DEACON' THEN '집사'
    WHEN 'ORDAINED_DEACON' THEN '안수집사'

    -- 기타
    WHEN 'TEACHER' THEN '교사'
    WHEN 'DIRECTOR' THEN '부장'
    WHEN 'PRESIDENT' THEN '회장'

    ELSE NULL
  END AS position_detail_label,
  get_position_category(m.position_main, m.birth_date) AS position_category
FROM public.members m;

COMMENT ON VIEW v_members_with_position_labels IS '교인 정보 + 직분 한글 레이블 + 주소록 카테고리';
