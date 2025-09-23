-- 보안 로그 테이블 안전하게 생성 (IF NOT EXISTS 사용)
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT, -- auth.users의 ID를 텍스트로 저장
  user_name TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  success BOOLEAN DEFAULT true,
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  church_id INTEGER,
  session_id TEXT
);

-- 활동 로그 테이블 안전하게 생성
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT, -- auth.users의 ID를 텍스트로 저장
  user_name TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  church_id INTEGER
);

-- 인덱스 안전하게 생성
DO $$
BEGIN
  -- security_logs 인덱스
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_security_logs_user_id') THEN
    CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_security_logs_action') THEN
    CREATE INDEX idx_security_logs_action ON security_logs(action);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_security_logs_timestamp') THEN
    CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp DESC);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_security_logs_church_id') THEN
    CREATE INDEX idx_security_logs_church_id ON security_logs(church_id);
  END IF;

  -- activity_logs 인덱스
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_activity_logs_user_id') THEN
    CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_activity_logs_action') THEN
    CREATE INDEX idx_activity_logs_action ON activity_logs(action);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_activity_logs_timestamp') THEN
    CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_activity_logs_church_id') THEN
    CREATE INDEX idx_activity_logs_church_id ON activity_logs(church_id);
  END IF;
END $$;

-- 테스트용 샘플 데이터 삽입 (security_logs가 비어있을 때만)
INSERT INTO security_logs (user_id, user_name, user_email, action, success, ip_address, user_agent, location, church_id, details)
SELECT
  '123e4567-e89b-12d3-a456-426614174000',
  '이선민',
  'composm@naver.com',
  'login',
  true,
  '192.168.1.100',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  '서울, 대한민국',
  7,
  '{"browser": "Chrome", "version": "119.0"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM security_logs LIMIT 1);

INSERT INTO security_logs (user_id, user_name, user_email, action, success, ip_address, user_agent, location, church_id, details, timestamp)
SELECT
  '123e4567-e89b-12d3-a456-426614174000',
  '이선민',
  'composm@naver.com',
  'failed_login',
  false,
  '192.168.1.101',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  '부산, 대한민국',
  7,
  '{"reason": "invalid_password", "attempts": 3}'::jsonb,
  NOW() - INTERVAL '1 hour'
WHERE NOT EXISTS (SELECT 1 FROM security_logs WHERE action = 'failed_login' LIMIT 1);

INSERT INTO security_logs (user_id, user_name, user_email, action, success, ip_address, user_agent, location, church_id, details, timestamp)
SELECT
  '456e7890-e89b-12d3-a456-426614174001',
  '김철수',
  'kim@example.com',
  'login',
  true,
  '192.168.1.102',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
  '대구, 대한민국',
  7,
  '{"browser": "Safari", "device": "mobile"}'::jsonb,
  NOW() - INTERVAL '30 minutes'
WHERE NOT EXISTS (SELECT 1 FROM security_logs WHERE user_name = '김철수' LIMIT 1);

-- 테스트용 샘플 데이터 삽입 (activity_logs가 비어있을 때만)
INSERT INTO activity_logs (user_id, user_name, user_email, action, resource, resource_id, church_id, details)
SELECT
  '123e4567-e89b-12d3-a456-426614174000',
  '이선민',
  'composm@naver.com',
  'member_add',
  'members',
  '123',
  7,
  '{"member_name": "김철수", "member_email": "kim@example.com"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM activity_logs LIMIT 1);

INSERT INTO activity_logs (user_id, user_name, user_email, action, resource, resource_id, church_id, details, timestamp)
SELECT
  '123e4567-e89b-12d3-a456-426614174000',
  '이선민',
  'composm@naver.com',
  'role_change',
  'users',
  '456',
  7,
  '{"from_role": "member", "to_role": "church_admin", "target_user": "박영희"}'::jsonb,
  NOW() - INTERVAL '2 hours'
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE action = 'role_change' LIMIT 1);

INSERT INTO activity_logs (user_id, user_name, user_email, action, resource, resource_id, church_id, details, timestamp)
SELECT
  '456e7890-e89b-12d3-a456-426614174001',
  '김철수',
  'kim@example.com',
  'offering_add',
  'offerings',
  '789',
  7,
  '{"amount": 50000, "type": "regular_offering"}'::jsonb,
  NOW() - INTERVAL '45 minutes'
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE action = 'offering_add' LIMIT 1);