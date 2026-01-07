-- ============================================================
-- 알림 테이블 생성
-- ============================================================
-- 앱 내 알림 목록에 표시될 알림을 저장하는 테이블
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  church_id bigint REFERENCES public.churches(id) ON DELETE CASCADE,

  -- 알림 종류 및 내용
  type text NOT NULL, -- 'announcement', 'pastoral_care', 'event', 'community', 'offering', etc.
  title text NOT NULL,
  message text NOT NULL,

  -- 관련 데이터 (JSON으로 저장)
  data jsonb,

  -- 읽음 상태
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,

  -- 타임스탬프
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- 인덱스용
  CONSTRAINT notifications_type_check CHECK (type IN (
    'announcement',
    'pastoral_care',
    'event',
    'community',
    'offering',
    'attendance',
    'message',
    'system'
  ))
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_church_id ON public.notifications(church_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- RLS 활성화
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 알림만 조회 가능
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid()::text::bigint = user_id);

-- RLS 정책: 사용자는 자신의 알림을 읽음 처리 가능
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid()::text::bigint = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 알림 테이블이 생성되었습니다!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '테이블 구조:';
  RAISE NOTICE '  - id: UUID (Primary Key)';
  RAISE NOTICE '  - user_id: 사용자 ID';
  RAISE NOTICE '  - church_id: 교회 ID';
  RAISE NOTICE '  - type: 알림 종류';
  RAISE NOTICE '  - title: 알림 제목';
  RAISE NOTICE '  - message: 알림 내용';
  RAISE NOTICE '  - data: 관련 데이터 (JSONB)';
  RAISE NOTICE '  - is_read: 읽음 여부';
  RAISE NOTICE '  - read_at: 읽은 시각';
  RAISE NOTICE '  - created_at: 생성일시';
  RAISE NOTICE '  - updated_at: 수정일시';
  RAISE NOTICE '';
  RAISE NOTICE '알림 종류:';
  RAISE NOTICE '  - announcement: 공지사항';
  RAISE NOTICE '  - pastoral_care: 심방';
  RAISE NOTICE '  - event: 행사';
  RAISE NOTICE '  - community: 커뮤니티';
  RAISE NOTICE '  - offering: 헌금';
  RAISE NOTICE '  - attendance: 출석';
  RAISE NOTICE '  - message: 메시지';
  RAISE NOTICE '  - system: 시스템';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
END $$;
