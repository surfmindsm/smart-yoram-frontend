-- ============================================================
-- 심방 신청 상태 변경 푸시 알림 설정 SQL
-- ============================================================
-- pastoral_care_requests 테이블의 상태가 변경될 때 자동으로 푸시 알림 발송
-- 특히 승인(approved), 예정(scheduled), 완료(completed) 상태 변경 시
-- ============================================================

-- ============================================================
-- 1. pg_net 확장 설치 확인 (HTTP 요청용)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- 2. Edge Function 호출용 Trigger Function
-- ============================================================
-- 주의: 이 함수는 SECURITY DEFINER로 실행되어 서비스 키를 안전하게 보호합니다.
CREATE OR REPLACE FUNCTION notify_pastoral_care_status_change()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  should_notify BOOLEAN;
BEGIN
  -- Edge Function URL 설정
  -- 프로젝트 ID: adzhdsajdamrflvybhxq
  function_url := 'https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/send-pastoral-care-notification';

  -- Service Role Key (SECURITY DEFINER로 보호됨)
  -- ⚠️ 주의: 실제 Service Role Key로 변경하세요!
  -- Supabase Dashboard → Settings → API → service_role key
  service_role_key := 'YOUR_SERVICE_ROLE_KEY_HERE';

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

-- ============================================================
-- 3. 심방 신청 INSERT/UPDATE 시 Trigger 발동
-- ============================================================
DROP TRIGGER IF EXISTS on_pastoral_care_status_changed ON public.pastoral_care_requests;

CREATE TRIGGER on_pastoral_care_status_changed
  AFTER INSERT OR UPDATE OF status ON public.pastoral_care_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_pastoral_care_status_change();

-- ============================================================
-- 완료 메시지
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '🏥 심방 신청 푸시 알림 설정이 완료되었습니다! ✅';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 완료된 설정:';
  RAISE NOTICE '   1. pg_net 확장 확인';
  RAISE NOTICE '   2. Trigger Function 생성 (notify_pastoral_care_status_change)';
  RAISE NOTICE '   3. Trigger 생성 (on_pastoral_care_status_changed)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 다음 단계:';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ Edge Function 배포:';
  RAISE NOTICE '   cd admin-dashboard';
  RAISE NOTICE '   supabase functions deploy send-pastoral-care-notification';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ 설정 확인:';
  RAISE NOTICE '   SELECT * FROM pg_extension WHERE extname = ''pg_net'';';
  RAISE NOTICE '   SELECT * FROM pg_trigger WHERE tgname = ''on_pastoral_care_status_changed'';';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ 테스트:';
  RAISE NOTICE '   - 관리자 대시보드에서 심방 신청 상태 변경';
  RAISE NOTICE '   - 앱에서 푸시 알림 수신 확인';
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣ Edge Function Logs 확인:';
  RAISE NOTICE '   https://supabase.com/dashboard/project/adzhdsajdamrflvybhxq/functions';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '💡 동작 방식:';
  RAISE NOTICE '   심방 신청 상태 변경 (approved/scheduled/completed/cancelled)';
  RAISE NOTICE '   → Trigger 발동 → Edge Function 호출';
  RAISE NOTICE '   → member_id로 user_id 조회 → FCM 푸시 발송';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 알림 발송 대상 상태:';
  RAISE NOTICE '   - approved: 승인됨';
  RAISE NOTICE '   - scheduled: 예정됨';
  RAISE NOTICE '   - completed: 완료됨';
  RAISE NOTICE '   - cancelled: 취소됨';
  RAISE NOTICE '=================================================';
END $$;
