-- 권한 그룹 시스템 생성
-- 이 마이그레이션은 교회별 세밀한 권한 관리를 위한 테이블들을 생성합니다.
-- 기존 role 기반 권한 시스템과 병행하여 사용됩니다.

-- 1. 권한 그룹 테이블
CREATE TABLE IF NOT EXISTS permission_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  category VARCHAR(50),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(church_id, code)
);

-- 2. 시스템 메뉴 정의 테이블
CREATE TABLE IF NOT EXISTS system_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES system_menus(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  path VARCHAR(200),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 권한 그룹별 메뉴 권한 테이블
CREATE TABLE IF NOT EXISTS permission_group_menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  permission_group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES system_menus(id) ON DELETE CASCADE,
  can_use BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(permission_group_id, menu_id)
);

-- 4. 사용자-권한그룹 매핑 테이블
CREATE TABLE IF NOT EXISTS user_permission_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_group_id UUID NOT NULL REFERENCES permission_groups(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, permission_group_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_permission_groups_church_id ON permission_groups(church_id);
CREATE INDEX IF NOT EXISTS idx_system_menus_parent_id ON system_menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_permission_group_menus_group_id ON permission_group_menus(permission_group_id);
CREATE INDEX IF NOT EXISTS idx_permission_group_menus_menu_id ON permission_group_menus(menu_id);
CREATE INDEX IF NOT EXISTS idx_user_permission_groups_user_id ON user_permission_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permission_groups_group_id ON user_permission_groups(permission_group_id);

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_group_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission_groups ENABLE ROW LEVEL SECURITY;

-- permission_groups RLS 정책
CREATE POLICY "사용자는 자신의 교회 권한 그룹만 조회 가능" ON permission_groups
  FOR SELECT USING (
    church_id IN (
      SELECT church_id FROM auth.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Church Super Admin은 자신의 교회 권한 그룹 생성 가능" ON permission_groups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND church_id = permission_groups.church_id
      AND role IN ('church_super_admin', 'super_admin')
    )
  );

CREATE POLICY "Church Super Admin은 자신의 교회 권한 그룹 수정 가능" ON permission_groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND church_id = permission_groups.church_id
      AND role IN ('church_super_admin', 'super_admin')
    )
  );

CREATE POLICY "Church Super Admin은 자신의 교회 권한 그룹 삭제 가능" ON permission_groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND church_id = permission_groups.church_id
      AND role IN ('church_super_admin', 'super_admin')
    )
  );

-- permission_group_menus RLS 정책
CREATE POLICY "사용자는 자신의 교회 권한 그룹 메뉴 조회 가능" ON permission_group_menus
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM permission_groups pg
      JOIN auth.users u ON u.church_id = pg.church_id
      WHERE pg.id = permission_group_menus.permission_group_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Church Super Admin은 권한 그룹 메뉴 관리 가능" ON permission_group_menus
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM permission_groups pg
      JOIN auth.users u ON u.church_id = pg.church_id
      WHERE pg.id = permission_group_menus.permission_group_id
      AND u.id = auth.uid()
      AND u.role IN ('church_super_admin', 'super_admin')
    )
  );

-- user_permission_groups RLS 정책
CREATE POLICY "사용자는 자신이 속한 권한 그룹 조회 가능" ON user_permission_groups
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM permission_groups pg
      JOIN auth.users u ON u.church_id = pg.church_id
      WHERE pg.id = user_permission_groups.permission_group_id
      AND u.id = auth.uid()
    )
  );

CREATE POLICY "Church Super Admin은 사용자 권한 그룹 관리 가능" ON user_permission_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM permission_groups pg
      JOIN auth.users u ON u.church_id = pg.church_id
      WHERE pg.id = user_permission_groups.permission_group_id
      AND u.id = auth.uid()
      AND u.role IN ('church_super_admin', 'super_admin')
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_permission_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER permission_groups_updated_at_trigger
  BEFORE UPDATE ON permission_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_permission_groups_updated_at();

-- 코멘트 추가
COMMENT ON TABLE permission_groups IS '교회별 권한 그룹 정의';
COMMENT ON TABLE system_menus IS '시스템 메뉴 구조 정의 (2단계 계층)';
COMMENT ON TABLE permission_group_menus IS '권한 그룹별 메뉴 접근 권한';
COMMENT ON TABLE user_permission_groups IS '사용자와 권한 그룹 매핑';
