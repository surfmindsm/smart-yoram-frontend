-- Create important_dates table for managing important events and dates
-- 중요 일정 관리 테이블 (출산, 결혼기념일, 회갑연, 환갑, 칠순 등)

CREATE TABLE IF NOT EXISTS public.important_dates (
  id SERIAL PRIMARY KEY,
  church_id INTEGER NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES public.members(id) ON DELETE SET NULL,

  -- 일정 정보
  event_type VARCHAR(50), -- '출산', '결혼기념일', '회갑', '환갑', '칠순', '팔순', '생신', '기타'
  title VARCHAR(255) NOT NULL,
  event_date DATE,
  description TEXT,

  -- D-day 알림 설정
  enable_dday_alert BOOLEAN DEFAULT true,
  alert_days_before INTEGER DEFAULT 7, -- 며칠 전부터 알림을 표시할지 (기본 7일)

  -- 상태 관리
  is_active BOOLEAN DEFAULT true,
  is_completed BOOLEAN DEFAULT false,

  -- 메타데이터
  created_by INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- 추가 정보
  notes TEXT
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_important_dates_church_id ON public.important_dates(church_id);
CREATE INDEX IF NOT EXISTS idx_important_dates_member_id ON public.important_dates(member_id);
CREATE INDEX IF NOT EXISTS idx_important_dates_event_date ON public.important_dates(event_date);
CREATE INDEX IF NOT EXISTS idx_important_dates_event_type ON public.important_dates(event_type);
CREATE INDEX IF NOT EXISTS idx_important_dates_is_active ON public.important_dates(is_active);

-- 복합 인덱스 (다가오는 일정 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_important_dates_upcoming ON public.important_dates(church_id, event_date, is_active)
  WHERE is_active = true AND is_completed = false;

-- 코멘트 추가
COMMENT ON TABLE public.important_dates IS '중요 일정 관리 테이블 (출산, 결혼기념일, 회갑연 등)';
COMMENT ON COLUMN public.important_dates.event_type IS '일정 유형 (출산, 결혼기념일, 회갑, 환갑, 칠순, 팔순, 생신, 기타)';
COMMENT ON COLUMN public.important_dates.event_date IS '일정 날짜';
COMMENT ON COLUMN public.important_dates.enable_dday_alert IS 'D-day 알림 활성화 여부';
COMMENT ON COLUMN public.important_dates.alert_days_before IS '며칠 전부터 알림을 표시할지 (기본 7일)';
COMMENT ON COLUMN public.important_dates.is_active IS '활성 상태';
COMMENT ON COLUMN public.important_dates.is_completed IS '완료 여부';

-- RLS (Row Level Security) 비활성화
-- 이 프로젝트는 커스텀 인증을 사용하며, Edge Functions에서 church_id 기반으로 접근 제어를 수행합니다.
ALTER TABLE public.important_dates DISABLE ROW LEVEL SECURITY;

-- updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_important_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
CREATE TRIGGER trigger_update_important_dates_updated_at
  BEFORE UPDATE ON public.important_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_important_dates_updated_at();
