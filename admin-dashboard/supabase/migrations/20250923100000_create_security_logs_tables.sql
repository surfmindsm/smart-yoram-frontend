-- 보안 로그 테이블 생성
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'failed_login', 'password_change', 'account_locked')),
  success BOOLEAN DEFAULT true,
  ip_address INET,
  user_agent TEXT,
  location TEXT,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  church_id INTEGER,
  session_id TEXT,

  CONSTRAINT security_logs_action_check CHECK (action IN ('login', 'logout', 'failed_login', 'password_change', 'account_locked'))
);

-- 활동 로그 테이블 생성
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  resource TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  church_id INTEGER,

  -- 활동 유형: create, read, update, delete, export, import 등
  CONSTRAINT activity_logs_action_check CHECK (action IN (
    'create', 'read', 'update', 'delete', 'export', 'import',
    'member_add', 'member_update', 'member_delete',
    'offering_add', 'offering_update', 'offering_delete',
    'attendance_add', 'attendance_update', 'attendance_delete',
    'bulletin_add', 'bulletin_update', 'bulletin_delete',
    'announcement_add', 'announcement_update', 'announcement_delete',
    'prayer_request_add', 'prayer_request_update', 'prayer_request_delete',
    'role_change', 'permission_change',
    'backup_create', 'backup_restore',
    'system_config_change'
  ))
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_church_id ON security_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_church_id ON activity_logs(church_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 관리자만 보안 로그를 볼 수 있도록 정책 설정
CREATE POLICY "Admin can view all security logs" ON security_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role IN ('super_admin', 'church_super_admin', 'church_admin')
    )
  );

CREATE POLICY "Admin can view all activity logs" ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role IN ('super_admin', 'church_super_admin', 'church_admin')
    )
  );

-- 시스템에서만 로그를 삽입할 수 있도록 정책 설정
CREATE POLICY "System can insert security logs" ON security_logs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can insert activity logs" ON activity_logs
  FOR INSERT
  WITH CHECK (true);

-- 테스트용 샘플 데이터 삽입 (개발환경에서만)
INSERT INTO security_logs (user_id, user_name, user_email, action, success, ip_address, user_agent, location, church_id, details)
SELECT
  auth.uid(),
  '이선민',
  'composm@naver.com',
  'login',
  true,
  '192.168.1.100'::inet,
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  '서울, 대한민국',
  7,
  '{"browser": "Chrome", "version": "119.0"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM security_logs LIMIT 1);

INSERT INTO security_logs (user_id, user_name, user_email, action, success, ip_address, user_agent, location, church_id, details)
SELECT
  auth.uid(),
  '이선민',
  'composm@naver.com',
  'failed_login',
  false,
  '192.168.1.101'::inet,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  '부산, 대한민국',
  7,
  '{"reason": "invalid_password", "attempts": 3}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM security_logs WHERE action = 'failed_login' LIMIT 1);

INSERT INTO activity_logs (user_id, user_name, user_email, action, resource, resource_id, church_id, details)
SELECT
  auth.uid(),
  '이선민',
  'composm@naver.com',
  'member_add',
  'members',
  '123',
  7,
  '{"member_name": "김철수", "member_email": "kim@example.com"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM activity_logs LIMIT 1);

INSERT INTO activity_logs (user_id, user_name, user_email, action, resource, resource_id, church_id, details)
SELECT
  auth.uid(),
  '이선민',
  'composm@naver.com',
  'role_change',
  'users',
  '456',
  7,
  '{"from_role": "member", "to_role": "church_admin", "target_user": "박영희"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM activity_logs WHERE action = 'role_change' LIMIT 1);

-- 코멘트 추가
COMMENT ON TABLE security_logs IS '사용자 인증 및 보안 관련 로그';
COMMENT ON TABLE activity_logs IS '사용자 활동 및 시스템 변경 로그';

COMMENT ON COLUMN security_logs.action IS '보안 액션: login, logout, failed_login, password_change, account_locked';
COMMENT ON COLUMN security_logs.success IS '액션 성공 여부';
COMMENT ON COLUMN security_logs.details IS '추가 세부 정보 (JSON)';

COMMENT ON COLUMN activity_logs.action IS '활동 유형: create, update, delete, 등';
COMMENT ON COLUMN activity_logs.resource IS '대상 리소스: members, offerings, attendance 등';
COMMENT ON COLUMN activity_logs.resource_id IS '리소스의 ID';
COMMENT ON COLUMN activity_logs.details IS '활동 세부 정보 (JSON)';