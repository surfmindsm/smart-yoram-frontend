-- ============================================================
-- 심방 신청 푸시 알림 트리거 수동 적용
-- ============================================================
-- Supabase Dashboard → SQL Editor에서 이 파일을 실행하세요
-- ============================================================

-- 1. 기존 트리거 삭제 (있다면)
DROP TRIGGER IF EXISTS on_pastoral_care_status_changed ON public.pastoral_care_requests;

-- 2. 기존 함수 삭제 (있다면)
DROP FUNCTION IF EXISTS notify_pastoral_care_status_change();

-- 3. pg_net 확장 확인
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 4. Trigger Function 생성
CREATE OR REPLACE FUNCTION notify_pastoral_care_status_change()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  should_notify BOOLEAN;
BEGIN
  -- Edge Function URL
  function_url := 'https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/send-pastoral-care-notification';

  -- Service Role Key
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg0ODk4MSwiZXhwIjoyMDY5NDI0OTgxfQ.qkS6gZgLlV7-NytGEgFAIMOYuYpv442Qx_gkDeD3z0s';

  -- 알림을 발송할지 결정
  should_notify := FALSE;

  -- INSERT 시: pending 상태로 생성되므로 알림 미발송
  IF (TG_OP = 'INSERT') THEN
    should_notify := FALSE;

  -- UPDATE 시: 상태가 변경되었고, 알림 발송 대상 상태인 경우
  ELSIF (TG_OP = 'UPDATE') THEN
    -- 상태가 변경되었는지 확인
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
      -- 승인, 예정, 완료, 취소 상태로 변경된 경우 알림 발송
      IF NEW.status IN ('approved', 'scheduled', 'completed', 'cancelled') THEN
        should_notify := TRUE;
      END IF;
    END IF;
  END IF;

  -- 알림 발송이 필요한 경우
  IF should_notify THEN
    -- Edge Function 비동기 호출 (pg_net 확장 사용)
    PERFORM
      net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'record', jsonb_build_object(
            'id', NEW.id,
            'church_id', NEW.church_id,
            'member_id', NEW.member_id,
            'requester_name', NEW.requester_name,
            'request_type', NEW.request_type,
            'status', NEW.status,
            'preferred_date', NEW.preferred_date,
            'scheduled_date', NEW.scheduled_date,
            'scheduled_time', NEW.scheduled_time,
            'created_at', NEW.created_at
          ),
          'old_record', CASE
            WHEN OLD IS NOT NULL THEN
              jsonb_build_object(
                'status', OLD.status
              )
            ELSE NULL
          END
        )
      );

    RAISE NOTICE '🏥 심방 신청 상태 변경 알림 발송 요청: ID=%, Status=% → %',
                 NEW.id, OLD.status, NEW.status;
  ELSE
    RAISE NOTICE '⏭️  심방 신청 알림 발송 건너뜀: ID=%, Status=%', NEW.id, NEW.status;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 오류가 발생해도 심방 신청 업데이트는 계속 진행
    RAISE WARNING '❌ FCM 알림 발송 중 오류 발생: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger 생성
CREATE TRIGGER on_pastoral_care_status_changed
  AFTER INSERT OR UPDATE OF status ON public.pastoral_care_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_pastoral_care_status_change();

-- 6. 확인
SELECT
  'Trigger Created' as status,
  t.tgname AS trigger_name,
  p.proname AS function_name,
  c.relname AS table_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
WHERE t.tgname = 'on_pastoral_care_status_changed';

-- 7. 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ 심방 신청 푸시 알림 트리거가 생성되었습니다!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. 심방 신청 상태를 approved로 변경';
  RAISE NOTICE '2. Edge Function 로그 확인:';
  RAISE NOTICE '   https://supabase.com/dashboard/project/adzhdsajdamrflvybhxq/functions/send-pastoral-care-notification';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
END $$;
