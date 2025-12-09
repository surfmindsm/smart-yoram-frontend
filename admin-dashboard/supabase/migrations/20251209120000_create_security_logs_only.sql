-- 보안 로그 테이블만 생성 (독립적으로 실행 가능)
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
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

-- 활동 로그 테이블 생성
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
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

-- 인덱스 생성 (이미 존재하면 무시)
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

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 모든 인증된 사용자가 자신의 로그를 읽을 수 있음
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'security_logs'
    AND policyname = 'Users can view their own security logs'
  ) THEN
    CREATE POLICY "Users can view their own security logs"
      ON security_logs FOR SELECT
      USING (auth.uid()::text = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'activity_logs'
    AND policyname = 'Users can view their own activity logs'
  ) THEN
    CREATE POLICY "Users can view their own activity logs"
      ON activity_logs FOR SELECT
      USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- RLS 정책: 인증된 사용자가 로그를 INSERT 할 수 있음
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'security_logs'
    AND policyname = 'Users can insert their own security logs'
  ) THEN
    CREATE POLICY "Users can insert their own security logs"
      ON security_logs FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'activity_logs'
    AND policyname = 'Users can insert their own activity logs'
  ) THEN
    CREATE POLICY "Users can insert their own activity logs"
      ON activity_logs FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
