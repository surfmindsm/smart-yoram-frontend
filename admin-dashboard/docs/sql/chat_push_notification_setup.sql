-- ============================================================
-- P2P 채팅 푸시 알림 설정 SQL
-- ============================================================
-- 이 파일을 Supabase SQL Editor에서 실행하세요.
-- ============================================================

-- ============================================================
-- 1. pg_net 확장 설치 (HTTP 요청용)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- 2. device_tokens 테이블 생성 (FCM 토큰 저장용)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    platform TEXT NOT NULL,  -- 'android' 또는 'ios'
    device_id TEXT,
    app_version TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, fcm_token)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON public.device_tokens(user_id, is_active);

-- ============================================================
-- 3. Edge Function 호출용 Trigger Function
-- ============================================================
-- 주의: 이 함수는 SECURITY DEFINER로 실행되어 일반 사용자는 내부를 볼 수 없습니다.
CREATE OR REPLACE FUNCTION notify_new_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  room_info JSONB;
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Edge Function URL 설정
  -- 프로젝트 ID: adzhdsajdamrflvybhxq
  function_url := 'https://adzhdsajdamrflvybhxq.supabase.co/functions/v1/send-chat-notification';

  -- Service Role Key (SECURITY DEFINER로 보호됨)
  -- ⚠️ 주의: 실제 Service Role Key로 변경하세요!
  -- Supabase Dashboard → Settings → API → service_role key
  service_role_key := 'YOUR_SERVICE_ROLE_KEY_HERE';

  -- 채팅방 정보 조회
  SELECT jsonb_build_object(
    'post_title', post_title,
    'post_id', post_id,
    'post_table', post_table
  ) INTO room_info
  FROM p2p_chat_rooms
  WHERE id = NEW.room_id;

  -- Edge Function 비동기 호출 (pg_net 확장 사용)
  PERFORM
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'message', jsonb_build_object(
          'id', NEW.id,
          'room_id', NEW.room_id,
          'sender_id', NEW.sender_id,
          'sender_name', NEW.sender_name,
          'message', NEW.message,
          'message_type', NEW.message_type,
          'created_at', NEW.created_at
        ),
        'room_info', room_info
      )
    );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 오류가 발생해도 메시지 삽입은 계속 진행
    RAISE WARNING 'FCM 알림 발송 중 오류 발생: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. 새 메시지 INSERT 시 Trigger 발동
-- ============================================================
DROP TRIGGER IF EXISTS on_chat_message_created ON p2p_chat_messages;

CREATE TRIGGER on_chat_message_created
  AFTER INSERT ON p2p_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_chat_message();

-- ============================================================
-- 완료 메시지
-- ============================================================
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'P2P 채팅 푸시 알림 설정이 완료되었습니다! ✅';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 완료된 설정:';
  RAISE NOTICE '   1. pg_net 확장 설치';
  RAISE NOTICE '   2. device_tokens 테이블 생성';
  RAISE NOTICE '   3. Trigger Function 생성 (notify_new_chat_message)';
  RAISE NOTICE '   4. Trigger 생성 (on_chat_message_created)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 다음 단계:';
  RAISE NOTICE '';
  RAISE NOTICE '1️⃣ FCM Server Key 설정 (필수):';
  RAISE NOTICE '   - Firebase Console에서 FCM Server Key 복사';
  RAISE NOTICE '   - 터미널에서 실행:';
  RAISE NOTICE '     cd admin-dashboard';
  RAISE NOTICE '     supabase secrets set FCM_SERVER_KEY=your_fcm_server_key_here';
  RAISE NOTICE '';
  RAISE NOTICE '2️⃣ 설정 확인:';
  RAISE NOTICE '   SELECT * FROM pg_extension WHERE extname = ''pg_net'';';
  RAISE NOTICE '   SELECT * FROM pg_trigger WHERE tgname = ''on_chat_message_created'';';
  RAISE NOTICE '';
  RAISE NOTICE '3️⃣ 테스트 (실제 채팅방 ID와 사용자 ID로 변경):';
  RAISE NOTICE '   INSERT INTO p2p_chat_messages';
  RAISE NOTICE '   (room_id, sender_id, sender_name, message, message_type)';
  RAISE NOTICE '   VALUES (1, 123, ''테스트'', ''테스트 메시지'', ''text'');';
  RAISE NOTICE '';
  RAISE NOTICE '4️⃣ Edge Function Logs 확인:';
  RAISE NOTICE '   https://supabase.com/dashboard/project/adzhdsajdamrflvybhxq/functions';
  RAISE NOTICE '';
  RAISE NOTICE '=================================================';
  RAISE NOTICE '🔒 보안: Service Role Key는 SECURITY DEFINER로 보호됨';
  RAISE NOTICE '=================================================';
END $$;
