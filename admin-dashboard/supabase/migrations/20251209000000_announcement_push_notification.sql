-- ============================================================
-- 공지사항 푸시 알림 설정 SQL
-- ============================================================
-- announcements 테이블에 INSERT 시 자동으로 푸시 알림 발송
-- ============================================================

-- ============================================================
-- 1. pg_net 확장 설치 확인 (HTTP 요청용)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- 2. Edge Function 호출용 Trigger Function
-- ============================================================
-- 주의: 이 함수는 SECURITY DEFINER로 실행되어 서비스 키를 안전하게 보호합니다.
CREATE OR REPLACE FUNCTION notify_new_announcement()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Edge Function URL 설정
  -- 프로젝트 ID: adzhdsajdamrflvybhxq
  function_url := 'https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/send-announcement-notification';

  -- Service Role Key (SECURITY DEFINER로 보호됨)
  -- ⚠️ 주의: 실제 Service Role Key로 변경하세요!
  -- Supabase Dashboard → Settings → API → service_role key
  service_role_key := 'YOUR_SERVICE_ROLE_KEY_HERE';

  -- Edge Function 비동기 호출 (pg_net 확장 사용)
  PERFORM
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'announcement', jsonb_build_object(
          'id', NEW.id,
          'church_id', NEW.church_id,
          'title', NEW.title,
          'content', NEW.content,
          'category', NEW.category,
          'author_name', NEW.author_name,
          'is_active', NEW.is_active,
          'created_at', NEW.created_at
        )
      )
    );

  RAISE NOTICE '📢 공지사항 알림 발송 요청: ID=%, Church=%, Title=%', NEW.id, NEW.church_id, NEW.title;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 오류가 발생해도 공지사항 삽입은 계속 진행
    RAISE WARNING '❌ FCM 알림 발송 중 오류 발생: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. 새 공지사항 INSERT 시 Trigger 발동
-- ============================================================
DROP TRIGGER IF EXISTS on_announcement_created ON public.announcements;

CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_announcement();

-- ============================================================
-- 완료 메시지
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '📢 공지사항 푸시 알림 설정이 완료되었습니다! ✅';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 완료된 설정:';
  RAISE NOTICE '   1. pg_net 확장 확인';
  RAISE NOTICE '   2. Trigger Function 생성 (notify_new_announcement)';
  RAISE NOTICE '   3. Trigger 생성 (on_announcement_created)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 다음 단계:';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ Edge Function 배포:';
  RAISE NOTICE '   cd admin-dashboard';
  RAISE NOTICE '   supabase functions deploy send-announcement-notification';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ 설정 확인:';
  RAISE NOTICE '   SELECT * FROM pg_extension WHERE extname = ''pg_net'';';
  RAISE NOTICE '   SELECT * FROM pg_trigger WHERE tgname = ''on_announcement_created'';';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ 테스트:';
  RAISE NOTICE '   - 관리자 대시보드에서 새 공지사항 작성';
  RAISE NOTICE '   - 앱에서 푸시 알림 수신 확인';
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣ Edge Function Logs 확인:';
  RAISE NOTICE '   https://supabase.com/dashboard/project/adzhdsajdamrflvybhxq/functions';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '💡 동작 방식:';
  RAISE NOTICE '   공지사항 INSERT → Trigger 발동 → Edge Function 호출';
  RAISE NOTICE '   → 해당 교회 사용자 조회 → FCM 푸시 발송';
  RAISE NOTICE '=================================================';
END $$;
