-- ============================================================
-- 공지사항 푸시 알림 설정 진단 SQL
-- ============================================================
-- Supabase SQL Editor에서 실행하여 설정 상태를 확인하세요
-- ============================================================

-- 1. pg_net 확장 확인
SELECT
  '1. pg_net 확장 상태' as check_item,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
    THEN '✅ 설치됨'
    ELSE '❌ 설치 안됨'
  END as status;

-- 2. 트리거 함수 존재 확인
SELECT
  '2. notify_new_announcement 함수' as check_item,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_new_announcement')
    THEN '✅ 존재함'
    ELSE '❌ 존재 안함'
  END as status;

-- 3. 트리거 존재 확인
SELECT
  '3. on_announcement_created 트리거' as check_item,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_announcement_created')
    THEN '✅ 존재함'
    ELSE '❌ 존재 안함'
  END as status;

-- 4. 최근 공지사항 확인 (최근 5개)
SELECT
  '4. 최근 공지사항 데이터' as check_item,
  COUNT(*) as total_announcements,
  MAX(created_at) as last_created
FROM announcements;

SELECT
  id,
  church_id,
  title,
  is_active,
  created_at
FROM announcements
ORDER BY created_at DESC
LIMIT 5;

-- 5. device_tokens 확인
SELECT
  '5. 활성 FCM 토큰' as check_item,
  COUNT(*) as active_tokens
FROM device_tokens
WHERE is_active = true;

-- 6. 교회별 활성 토큰 수
SELECT
  u.church_id,
  COUNT(*) as token_count
FROM device_tokens dt
JOIN users u ON u.id = dt.user_id
WHERE dt.is_active = true
GROUP BY u.church_id
ORDER BY token_count DESC;

-- 7. 트리거 함수 소스 확인 (Service Role Key 확인용)
SELECT
  '7. 트리거 함수 소스 코드' as check_item,
  LEFT(prosrc, 200) as function_source_preview
FROM pg_proc
WHERE proname = 'notify_new_announcement';

-- 8. pg_net 요청 로그 확인 (최근 10개)
-- 주의: pg_net.http_collect_response()로 결과 확인
SELECT
  '8. pg_net 요청 로그' as check_item,
  'pg_net._http_response 테이블 확인 필요' as note;

-- 9. 진단 요약
DO $$
DECLARE
  has_pg_net BOOLEAN;
  has_function BOOLEAN;
  has_trigger BOOLEAN;
  announcement_count INTEGER;
  token_count INTEGER;
BEGIN
  -- 각 항목 확인
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') INTO has_pg_net;
  SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'notify_new_announcement') INTO has_function;
  SELECT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_announcement_created') INTO has_trigger;
  SELECT COUNT(*) INTO announcement_count FROM announcements;
  SELECT COUNT(*) INTO token_count FROM device_tokens WHERE is_active = true;

  RAISE NOTICE '=================================================';
  RAISE NOTICE '📊 공지사항 푸시 알림 진단 결과';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'pg_net 확장: %', CASE WHEN has_pg_net THEN '✅' ELSE '❌' END;
  RAISE NOTICE '트리거 함수: %', CASE WHEN has_function THEN '✅' ELSE '❌' END;
  RAISE NOTICE '트리거: %', CASE WHEN has_trigger THEN '✅' ELSE '❌' END;
  RAISE NOTICE '총 공지사항: % 개', announcement_count;
  RAISE NOTICE '활성 FCM 토큰: % 개', token_count;
  RAISE NOTICE '=================================================';

  IF NOT has_pg_net THEN
    RAISE NOTICE '⚠️ pg_net 확장을 설치하세요: CREATE EXTENSION pg_net;';
  END IF;

  IF NOT has_function THEN
    RAISE NOTICE '⚠️ 트리거 함수가 없습니다. 마이그레이션을 다시 실행하세요.';
  END IF;

  IF NOT has_trigger THEN
    RAISE NOTICE '⚠️ 트리거가 없습니다. 마이그레이션을 다시 실행하세요.';
  END IF;

  IF token_count = 0 THEN
    RAISE NOTICE '⚠️ 활성 FCM 토큰이 없습니다. 앱에서 로그인 후 토큰을 등록하세요.';
  END IF;

  RAISE NOTICE '=================================================';
END $$;
