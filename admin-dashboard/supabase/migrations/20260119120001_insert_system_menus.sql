-- 시스템 메뉴 초기 데이터 삽입
-- Layout.tsx의 메뉴 구조를 기반으로 한 시스템 메뉴 정의

-- 1Depth 메뉴 삽입 (메인 그룹)
INSERT INTO system_menus (code, name, path, display_order, parent_id) VALUES
  ('DASHBOARD', '대시보드 & 분석', '/dashboard', 1, NULL),
  ('MEMBER', '교인 관리', NULL, 2, NULL),
  ('FINANCE', '재정 관리', NULL, 3, NULL),
  ('WORSHIP', '예배 & 소식', NULL, 4, NULL),
  ('OPERATION', '교회 운영 & 설정', NULL, 5, NULL),
  ('AI', 'AI 기능 (Premium)', NULL, 6, NULL),
  ('SECURITY', '보안 & 시스템', NULL, 7, NULL)
ON CONFLICT (code) DO NOTHING;

-- 2Depth 메뉴 삽입 (교인 관리 하위)
INSERT INTO system_menus (code, name, path, display_order, parent_id) VALUES
  ('MEMBER_MGMT', '교인 관리', '/member-management', 1, (SELECT id FROM system_menus WHERE code = 'MEMBER')),
  ('ORG_MGMT', '조직 관리', '/organization-management', 2, (SELECT id FROM system_menus WHERE code = 'MEMBER')),
  ('PASTORAL_CARE', '심방 신청 관리', '/pastoral-care', 3, (SELECT id FROM system_menus WHERE code = 'MEMBER')),
  ('PRAYER', '중보 기도 요청', '/prayer-requests', 4, (SELECT id FROM system_menus WHERE code = 'MEMBER'))
ON CONFLICT (code) DO NOTHING;

-- 2Depth 메뉴 삽입 (재정 관리 하위)
INSERT INTO system_menus (code, name, path, display_order, parent_id) VALUES
  ('ACCOUNTING', '회계 관리', '/accounting', 1, (SELECT id FROM system_menus WHERE code = 'FINANCE')),
  ('ACCOUNT_CAT', '계정 과목 관리', '/account-categories', 2, (SELECT id FROM system_menus WHERE code = 'FINANCE')),
  ('BUDGET', '예산 관리', '/budget', 3, (SELECT id FROM system_menus WHERE code = 'FINANCE')),
  ('SETTLEMENT', '결산 관리', '/settlement', 4, (SELECT id FROM system_menus WHERE code = 'FINANCE')),
  ('DONATION', '헌금 관리', '/donations', 5, (SELECT id FROM system_menus WHERE code = 'FINANCE'))
ON CONFLICT (code) DO NOTHING;

-- 2Depth 메뉴 삽입 (예배 & 소식 하위)
INSERT INTO system_menus (code, name, path, display_order, parent_id) VALUES
  ('WORSHIP_SCHEDULE', '예배 시간', '/worship-schedule', 1, (SELECT id FROM system_menus WHERE code = 'WORSHIP')),
  ('BULLETIN', '주보 관리', '/bulletins', 2, (SELECT id FROM system_menus WHERE code = 'WORSHIP')),
  ('ANNOUNCEMENT', '공지사항', '/announcements', 3, (SELECT id FROM system_menus WHERE code = 'WORSHIP')),
  ('MESSAGE', '메시지 보내기', '/message-sending', 4, (SELECT id FROM system_menus WHERE code = 'WORSHIP'))
ON CONFLICT (code) DO NOTHING;

-- 2Depth 메뉴 삽입 (교회 운영 & 설정 하위)
INSERT INTO system_menus (code, name, path, display_order, parent_id) VALUES
  ('CHURCH_INFO', '교회 정보', '/church', 1, (SELECT id FROM system_menus WHERE code = 'OPERATION')),
  ('SCHEDULE', '일정 관리', '/important-dates', 2, (SELECT id FROM system_menus WHERE code = 'OPERATION'))
ON CONFLICT (code) DO NOTHING;

-- 2Depth 메뉴 삽입 (AI 기능 하위)
INSERT INTO system_menus (code, name, path, display_order, parent_id) VALUES
  ('AI_CHAT', 'AI 교역자', '/ai-chat', 1, (SELECT id FROM system_menus WHERE code = 'AI')),
  ('AI_AGENT', '에이전트 관리', '/ai-agent-management', 2, (SELECT id FROM system_menus WHERE code = 'AI')),
  ('SERMON_LIB', '설교 자료 관리', '/sermon-library', 3, (SELECT id FROM system_menus WHERE code = 'AI')),
  ('AI_TOOLS', 'AI Tools', '/ai-tools', 4, (SELECT id FROM system_menus WHERE code = 'AI'))
ON CONFLICT (code) DO NOTHING;

-- 2Depth 메뉴 삽입 (보안 & 시스템 하위)
INSERT INTO system_menus (code, name, path, display_order, parent_id) VALUES
  ('SECURITY_LOG', '보안 로그', '/security-logs', 1, (SELECT id FROM system_menus WHERE code = 'SECURITY')),
  ('SYS_ANNOUNCE', '시스템 공지사항 관리', '/system-announcements', 2, (SELECT id FROM system_menus WHERE code = 'SECURITY')),
  ('SYS_ANNOUNCE_LIST', '시스템 공지사항', '/system-announcements-list', 3, (SELECT id FROM system_menus WHERE code = 'SECURITY')),
  ('SERMON_MGMT', '명설교 관리', '/sermons', 4, (SELECT id FROM system_menus WHERE code = 'SECURITY')),
  ('CHURCH_APP', '교회 가입 신청 관리', '/church-applications', 5, (SELECT id FROM system_menus WHERE code = 'SECURITY')),
  ('COMMUNITY_APP', '커뮤니티 신청 관리', '/community-applications', 6, (SELECT id FROM system_menus WHERE code = 'SECURITY')),
  ('CHURCH_MGMT', '교회 관리', '/church-management', 7, (SELECT id FROM system_menus WHERE code = 'SECURITY')),
  ('GPT_LICENSE', 'GPT 라이선스 관리', '/gpt-license-management', 8, (SELECT id FROM system_menus WHERE code = 'SECURITY')),
  ('ADMIN_ROLE', '관리자 권한 관리', '/admin-roles', 9, (SELECT id FROM system_menus WHERE code = 'SECURITY')),
  ('PERMISSION_GROUP', '권한 그룹 관리', '/permission-groups', 10, (SELECT id FROM system_menus WHERE code = 'SECURITY'))
ON CONFLICT (code) DO NOTHING;

-- 메뉴 개수 확인용 쿼리 (주석)
-- SELECT
--   (SELECT COUNT(*) FROM system_menus WHERE parent_id IS NULL) as "1Depth 메뉴",
--   (SELECT COUNT(*) FROM system_menus WHERE parent_id IS NOT NULL) as "2Depth 메뉴",
--   (SELECT COUNT(*) FROM system_menus) as "전체 메뉴";
