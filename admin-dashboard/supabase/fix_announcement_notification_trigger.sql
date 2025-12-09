-- ============================================================
-- 공지사항 푸시 알림 트리거 함수 수정 (Service Role Key 업데이트)
-- ============================================================
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

CREATE OR REPLACE FUNCTION notify_new_announcement()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Edge Function URL 설정
  function_url := 'https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/send-announcement-notification';

  -- Service Role Key (SECURITY DEFINER로 보호됨)
  service_role_key := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzg0ODk4MSwiZXhwIjoyMDY5NDI0OTgxfQ.qkS6gZgLlV7-NytGEgFAIMOYuYpv442Qx_gkDeD3z0s';

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

-- 성공 메시지
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ notify_new_announcement 함수가 업데이트되었습니다!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📝 다음 단계:';
  RAISE NOTICE '1. http://localhost:3000/announcements 에서 새 공지사항 작성';
  RAISE NOTICE '2. Edge Function 로그 확인';
  RAISE NOTICE '3. 앱에서 푸시 알림 수신 확인';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
END $$;
