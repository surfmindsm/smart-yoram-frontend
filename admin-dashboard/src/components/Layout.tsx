import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { supabaseApiService } from '../services/supabaseApiService';
import AnnouncementModal from './AnnouncementModal';
import BugReportModal from './BugReportModal';
import {
  BarChart3,
  ChartLine,
  Users,
  CheckSquare,
  FileText,
  Church,
  LogOut,
  Megaphone,
  Heart,
  Bell,
  Bot,
  TrendingUp,
  UserCheck,
  Wrench,
  DollarSign,
  Library,
  Shield,
  Gift,
  HandHeart,
  Briefcase,
  UserPlus,
  Music,
  Calendar,
  Home,
  UserCheck2,
  Key,
  UserCog,
  Building2,
  Calculator,
  Video,
  AlertTriangle,
  HelpCircle,
  ListChecks,
  MessageSquare,
  Clock,
  Search,
  ChevronDown,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from "./ui";
import { Alert, AlertDescription } from "./ui";
import {
  isSuperAdmin,
  getCommunityMenus,
  normalizeRole,
  isChurchSuperAdmin,
  isChurchAdmin,
  MenuPermission,
  getAccessibleMenuPaths
} from '../utils/userPermissions';
import { permissionGroupService } from '../services/permissionGroupService';
import { PermissionProvider } from '../contexts/PermissionContext';

interface MenuItem {
  path: string;
  name: string;
  Icon?: React.ComponentType<{ className?: string }>;
  count?: string | number;
}

interface MenuGroup {
  title: string;
  Icon?: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

const Layout: React.FC = () => {
  const [userInfo, setUserInfo] = useState<{name?: string, email?: string, church_id?: number, role?: string, id?: string} | null>(null);
  const [churchInfo, setChurchInfo] = useState<{gpt_licenses_active?: number, gpt_api_key?: string, name?: string} | null>(null);
  const [userPermissions, setUserPermissions] = useState<MenuPermission[]>([]);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [pageTitle, setPageTitle] = useState<string | undefined>(undefined);
  const [pageLeading, setPageLeading] = useState<React.ReactNode>(null);
  const [pageSubtitle, setPageSubtitle] = useState<string | undefined>(undefined);
  const [pageActions, setPageActions] = useState<React.ReactNode>(null);
  const [menuCounts, setMenuCounts] = useState<{
    members?: number;
    pastoralCare?: number;
    prayers?: number;
  }>({});
  const navigate = useNavigate();
  const location = useLocation();


  // Outlet context를 안정 참조로 (매 렌더링마다 새 객체 → 자식 무한 루프 방지)
  // setPageSubtitle/setPageActions는 useState의 setter라 React가 안정 참조 보장
  const outletContext = React.useMemo(
    () => ({ setPageTitle, setPageLeading, setPageSubtitle, setPageActions }),
    []
  );

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024;
      setShowMobileWarning(isMobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const result = await supabaseAuthService.getCurrentUser();
        if (!result) {
          navigate('/login');
          return;
        }
        const user = result.user;
        const processedUser = {
          name: user.full_name || user.name || user.username || '사용자',
          email: user.email,
          church_id: user.church_id,
          role: normalizeRole(user.role),
          id: user.id
        };
        setUserInfo(processedUser);

        if (processedUser.role === 'church_admin' && processedUser.id) {
          try {
            const permissionsResult = await permissionGroupService.getUserPermissions(processedUser.id);
            setUserPermissions(permissionsResult.data || []);
          } catch (permError) {
            console.error('❌ 사용자 권한 조회 실패:', permError);
            setUserPermissions([]);
          }
        } else {
          setUserPermissions([]);
        }

        if (user.church_id) {
          try {
            const { data: churchData, error: churchError } = await supabaseApiService.supabase
              .from('churches')
              .select('gpt_licenses_active, gpt_api_key, name')
              .eq('id', user.church_id)
              .single();
            if (churchError) {
              console.error('❌ 교회 정보 조회 실패:', churchError);
            } else {
              setChurchInfo(churchData);
            }
          } catch (churchError) {
            console.error('❌ 교회 정보 가져오기 오류:', churchError);
          }
        }
      } catch (error) {
        console.error('❌ 사용자 정보 가져오기 오류:', error);
      }
    };
    fetchUserInfo();
  }, [navigate]);

  // 사이드바 메뉴 카운트 — React Query로 캐싱 (화면 간 공유 + 자동 재요청 차단)
  const churchIdForCounts = userInfo?.church_id;
  const countsEnabled = !!churchIdForCounts && churchIdForCounts !== 9998;

  const { data: membersCountData } = useQuery({
    queryKey: ['sidebarCount', 'members', churchIdForCounts],
    queryFn: async () => {
      const res: any = await supabaseApiService.members.getAll({ church_id: churchIdForCounts!, limit: 9999 });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list.length as number;
    },
    enabled: countsEnabled,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  const { data: pastoralCountData } = useQuery({
    queryKey: ['sidebarCount', 'pastoralCare', churchIdForCounts],
    queryFn: async () => {
      const res: any = await supabaseApiService.pastoralCare?.getAll?.({ church_id: churchIdForCounts! });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list.filter((r: any) =>
        ['pending', 'approved', 'scheduled', 'in_progress'].includes(r.status)
      ).length as number;
    },
    enabled: countsEnabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  const { data: prayersCountData } = useQuery({
    queryKey: ['sidebarCount', 'prayers', churchIdForCounts],
    queryFn: async () => {
      const res: any = await supabaseApiService.prayerRequests?.getAll?.({ church_id: churchIdForCounts! });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list.filter((r: any) => r.status === 'active').length as number;
    },
    enabled: countsEnabled,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  useEffect(() => {
    setMenuCounts(prev => ({
      ...prev,
      members: membersCountData ?? prev.members,
      pastoralCare: pastoralCountData ?? prev.pastoralCare,
      prayers: prayersCountData ?? prev.prayers,
    }));
  }, [membersCountData, pastoralCountData, prayersCountData]);

  const handleLogout = async () => {
    try {
      await supabaseAuthService.signOut();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      navigate('/login');
    }
  };

  const isSystemAdmin = userInfo ? isSuperAdmin(userInfo) : false;
  const isCommunityOnlyUser = userInfo ? userInfo.church_id === 9998 : false;

  const getIconByName = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
      'Home': Home,
      'Gift': Gift,
      'MessageSquare': MessageSquare,
      'HandHeart': HandHeart,
      'Briefcase': Briefcase,
      'User': UserPlus,
      'Music': Music,
      'Users': Users,
      'Calendar': Calendar,
      'UserCheck': UserCheck
    };
    return iconMap[iconName] || Home;
  };

  const communityMenuGroups: MenuGroup[] = React.useMemo(() => [
    {
      title: '커뮤니티',
      items: getCommunityMenus().map(menu => ({
        path: menu.path,
        name: menu.name,
        Icon: getIconByName(menu.icon)
      })),
    },
  ], []);

  const accessiblePaths = React.useMemo(() => {
    if (!userInfo) return [];
    return getAccessibleMenuPaths(userInfo, userPermissions);
  }, [userInfo, userPermissions]);

  const filterMenuItems = React.useCallback((items: MenuItem[]): MenuItem[] => {
    if (!userInfo || !isChurchAdmin(userInfo) || accessiblePaths.length === 0) {
      return items;
    }
    return items.filter(item => accessiblePaths.includes(item.path));
  }, [userInfo, accessiblePaths]);

  // 대시보드는 그룹 밖 (최상단 단독 메뉴)
  const dashboardItem: MenuItem = { path: '/dashboard', name: '대시보드', Icon: Home };

  // Direction C — 그룹 IA 재편: 교인 / 재정 / 예배·소식 / 운영·설정 / 보안·시스템
  const defaultMenuGroups: MenuGroup[] = React.useMemo(() => {
    const groups: MenuGroup[] = [
      {
        title: '교인 관리',
        Icon: Users,
        items: filterMenuItems([
          { path: '/member-management', name: '교인 관리', count: menuCounts.members },
          { path: '/organization-management', name: '조직 · 부서 관리' },
          { path: '/attendance', name: '출석 관리' },
          { path: '/pastoral-care', name: '심방 관리', count: menuCounts.pastoralCare },
          { path: '/prayer-requests', name: '중보 기도', count: menuCounts.prayers },
        ] as MenuItem[]),
      },
      {
        title: '재정 관리',
        Icon: Calculator,
        items: filterMenuItems([
          { path: '/accounting', name: '회계 관리' },
          { path: '/account-categories', name: '계정과목 관리' },
          { path: '/budget', name: '예산 관리' },
          { path: '/settlement', name: '결산 관리' },
          { path: '/donations', name: '헌금 관리' },
        ] as MenuItem[]),
      },
      {
        title: '예배 & 소식',
        Icon: Clock,
        items: filterMenuItems([
          { path: '/worship-schedule', name: '예배 시간표' },
          { path: '/daily-verses', name: '오늘의 말씀' },
          { path: '/bulletins', name: '주보 · 공지' },
          ...(isSystemAdmin ? [] : [{ path: '/announcements', name: '공지사항' }]),
          { path: '/message-sending', name: '푸시 알림' },
          { path: '/sms', name: 'SMS 발송' },
        ] as MenuItem[]),
      },
      {
        title: '교회 운영 & 설정',
        Icon: Building2,
        items: filterMenuItems([
          { path: '/church', name: '교회 정보' },
          { path: '/important-dates', name: '일정 관리' },
          { path: '/analytics', name: '통계 분석' },
          { path: '/excel', name: '엑셀 관리' },
        ] as MenuItem[]),
      },
    ];

    // AI 기능 (Premium) — GPT 권한 보유 시에만 노출
    const gptEnabled = !!(churchInfo && (
      (churchInfo.gpt_licenses_active && churchInfo.gpt_licenses_active > 0) ||
      (churchInfo.gpt_api_key && churchInfo.gpt_api_key !== null)
    ));
    if (gptEnabled) {
      groups.push({
        title: 'AI (Premium)',
        Icon: Bot,
        items: [
          { path: '/ai-chat', name: 'AI 교역자' },
          { path: '/ai-agent-management', name: '에이전트 관리' },
          { path: '/sermon-library', name: '설교 자료 관리' },
          { path: '/ai-tools', name: 'AI Tools' },
        ] as MenuItem[],
      });
    }

    // 보안 & 시스템 (역할별)
    const systemItems: MenuItem[] = [];
    if (userInfo && isChurchSuperAdmin(userInfo)) {
      systemItems.push({ path: '/security-logs', name: '보안 로그' } as MenuItem);
    }
    if (userInfo && (isChurchAdmin(userInfo) || isChurchSuperAdmin(userInfo)) && !isSystemAdmin) {
      systemItems.push({ path: '/system-announcements-list', name: '시스템 공지사항' } as MenuItem);
    }
    if (isSystemAdmin) {
      systemItems.push(
        { path: '/security-logs', name: '보안 로그' } as MenuItem,
        { path: '/system-announcements', name: '시스템 공지사항 관리' } as MenuItem,
        { path: '/sermons', name: '명설교 관리' } as MenuItem,
        { path: '/church-applications', name: '교회 가입 신청' } as MenuItem,
        { path: '/community-applications', name: '커뮤니티 신청' } as MenuItem,
        { path: '/church-management', name: '교회 관리' } as MenuItem,
        { path: '/gpt-license-management', name: 'GPT 라이선스' } as MenuItem,
      );
    }
    if (userInfo && isChurchSuperAdmin(userInfo)) {
      systemItems.push(
        { path: '/admin-roles', name: '관리자 권한 관리' } as MenuItem,
        { path: '/permission-groups', name: '권한 그룹 관리' } as MenuItem,
      );
    }
    if (systemItems.length > 0) {
      groups.push({ title: '보안 & 시스템', Icon: Shield, items: systemItems });
    }

    return groups;
  }, [userInfo, isSystemAdmin, churchInfo, filterMenuItems, menuCounts]);

  const menuGroups = React.useMemo(() => {
    const baseMenuGroups = isCommunityOnlyUser ? communityMenuGroups : defaultMenuGroups;
    return baseMenuGroups.filter(group => group.items && group.items.length > 0);
  }, [isCommunityOnlyUser, communityMenuGroups, defaultMenuGroups]);

  // 그룹 펼침/접힘 상태 (localStorage로 영속화)
  const STORAGE_KEY = 'sidebar:collapsed-groups';
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return new Set(JSON.parse(raw));
    } catch {}
    return new Set();
  });

  const toggleGroup = React.useCallback((title: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  }, []);


  // 현재 활성 메뉴 정보 (탑바 breadcrumb 용)
  const activeMenu = React.useMemo(() => {
    for (const group of menuGroups) {
      const match = group.items.find(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));
      if (match) return { group: group.title, name: match.name };
    }
    return null;
  }, [menuGroups, location.pathname]);

  const churchName = churchInfo?.name || '교회';
  const userInitial = userInfo?.name?.charAt(0) || 'U';

  return (
    <div className="min-h-screen bg-background flex">
      {/* ===== Dark Sidebar (Direction C) ===== */}
      <aside
        className="fixed left-0 top-0 z-40 flex h-screen w-[236px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
        style={{ fontFeatureSettings: "'tnum'" }}
      >
        {/* Wordmark */}
        <Link
          to="/dashboard"
          className="flex h-[58px] flex-shrink-0 items-center border-b border-sidebar-border px-5"
          style={{ letterSpacing: '-0.01em' }}
        >
          <span
            className="text-primary"
            style={{
              fontFamily: 'Newsreader, Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: '21px',
            }}
          >
            church
          </span>
          <span
            className="ml-1 text-white"
            style={{ fontWeight: 800, fontSize: '21px' }}
          >
            round
          </span>
        </Link>

        {/* Quick search */}
        <div className="mx-4 mt-3.5 mb-1.5 flex h-[34px] items-center gap-2 rounded-lg border border-[hsl(var(--sidebar-chip))] bg-[#172033] px-3 text-[12.5px] text-[#6B7A95]">
          <Search className="h-3.5 w-3.5" />
          <span>빠른 검색</span>
          <span className="ml-auto rounded border border-[hsl(var(--sidebar-chip))] px-1.5 py-px text-[10px]">
            ⌘K
          </span>
        </div>

        {/* Nav */}
        <nav className="slim-scrollbar-dark flex-1 overflow-y-auto px-3 pb-4 pt-2">
          {/* 대시보드 — 그룹 밖 단독 메뉴 */}
          {!isCommunityOnlyUser && (() => {
            const isActive =
              location.pathname === dashboardItem.path ||
              location.pathname.startsWith(dashboardItem.path + '/');
            const Icon = dashboardItem.Icon!;
            return (
              <Link
                to={dashboardItem.path}
                className={cn(
                  'mb-2 flex items-center gap-[11px] rounded-[7px] px-2.5 py-[8px] text-[13.5px] font-semibold transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-sidebar-foreground hover:bg-[#172033]'
                )}
              >
                <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-[#9DB0CC]')} />
                <span className="truncate">{dashboardItem.name}</span>
              </Link>
            );
          })()}

          {menuGroups.map((group, gi) => {
            // 사용자가 명시적으로 접었으면 접힌 상태 유지 (활성 메뉴 있어도)
            const isExpanded = !collapsedGroups.has(group.title);
            const GroupIcon = group.Icon;
            return (
              <div key={`${group.title}-${gi}`} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="flex w-full items-center justify-between rounded-[7px] px-2.5 py-[8px] text-left transition-colors hover:bg-[#172033]/60"
                >
                  <span className="flex items-center gap-2.5">
                    {GroupIcon && (
                      <GroupIcon className="h-[15px] w-[15px] flex-shrink-0 text-[#C3CDDE]" />
                    )}
                    <span className="text-[13px] font-bold tracking-[-0.01em] text-[#E6ECF6]">
                      {group.title}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-[#C3CDDE] transition-transform",
                      isExpanded ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="mt-0.5 space-y-px pl-[26px]">
                    {group.items.map((item) => {
                      const isActive =
                        location.pathname === item.path ||
                        location.pathname.startsWith(item.path + '/');
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            'flex items-center gap-2 rounded-[6px] px-2.5 py-[7px] text-[12.5px] font-medium transition-colors',
                            isActive
                              ? 'bg-primary text-white'
                              : 'text-[#AEBACE] hover:bg-[#172033] hover:text-white'
                          )}
                        >
                          <span className="truncate">{item.name}</span>
                          {item.count != null && item.count !== 0 && (
                            <span
                              className={cn(
                                'ml-auto rounded-full px-[7px] py-px text-[10.5px] font-bold tabular-nums',
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-sidebar-chip text-[#9DB0CC]'
                              )}
                            >
                              {typeof item.count === 'number' && item.count >= 1000
                                ? `${Math.floor(item.count / 1000)}k+`
                                : item.count}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User block + actions */}
        <div className="flex-shrink-0 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-4 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-white">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-semibold text-[#E6ECF6]">
                {userInfo?.name || '사용자'}
              </div>
              <div className="truncate text-[11px] text-[#6B7A95]">
                {churchName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBugReportModal(true)}
              className="h-8 flex-1 justify-start gap-2 px-2 text-[12px] text-[#AEBACE] hover:bg-[#172033] hover:text-white"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              문의
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="h-8 flex-1 justify-start gap-2 px-2 text-[12px] text-[#AEBACE] hover:bg-[#172033] hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              로그아웃
            </Button>
          </div>
        </div>
      </aside>

      {/* ===== Main ===== */}
      <main className="ml-[236px] flex min-h-screen flex-1 flex-col">
        {/* Top bar — 페이지명 + 부제 (좌) + 페이지 액션 (우, outlet context로 설정) */}
        <div className="sticky top-0 z-30 flex h-[58px] flex-shrink-0 items-center gap-3 border-b border-border bg-card px-6">
          {pageLeading && (
            <div className="flex items-center gap-2">
              {pageLeading}
            </div>
          )}
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="text-[15px] font-bold tracking-[-0.01em] text-foreground whitespace-nowrap">
              {pageTitle ?? activeMenu?.name ?? '대시보드'}
            </span>
            {pageSubtitle && (
              <span className="truncate text-[13px] text-muted-foreground">
                {pageSubtitle}
              </span>
            )}
          </div>
          <div className="flex-1" />
          {pageActions && (
            <div className="flex items-center gap-2">
              {pageActions}
            </div>
          )}
        </div>

        {/* Page body */}
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-full">
            {showMobileWarning && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>모바일 환경 감지</strong>
                  <br />
                  관리자 화면은 데스크톱 환경에 최적화되어 있습니다. 모바일 기기에서는 레이아웃이 제대로 표시되지 않을 수 있습니다. PC에서 접속하시는 것을 권장합니다.
                </AlertDescription>
              </Alert>
            )}

            <AnnouncementModal />

            <PermissionProvider user={userInfo} permissions={userPermissions}>
              <Outlet context={outletContext} />
            </PermissionProvider>
          </div>
        </div>
      </main>

      <BugReportModal open={showBugReportModal} onOpenChange={setShowBugReportModal} />
    </div>
  );
};

export default Layout;
