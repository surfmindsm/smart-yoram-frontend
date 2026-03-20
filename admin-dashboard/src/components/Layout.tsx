import React, { useState, useEffect } from 'react';
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
  Users2,
  Gift,
  HandHeart,
  Briefcase,
  UserPlus,
  Music,
  Calendar,
  Home,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from "./ui";
import { Alert, AlertDescription } from "./ui";
import {
  isCommunityAdmin,
  isSuperAdmin,
  getCommunityMenus,
  normalizeRole,
  canAccessAdminDashboard,
  isMember,
  isChurchSuperAdmin,
  isChurchAdmin,
  MenuPermission,
  getAccessibleMenuPaths
} from '../utils/userPermissions';
import { permissionGroupService } from '../services/permissionGroupService';
import { PermissionProvider } from '../contexts/PermissionContext';

interface MenuGroup {
  title: string;
  items: Array<{
    path: string;
    name: string;
    Icon: React.ComponentType<any>;
  }>;
}

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userInfo, setUserInfo] = useState<{name?: string, email?: string, church_id?: number, role?: string, id?: string} | null>(null);
  const [churchInfo, setChurchInfo] = useState<{gpt_licenses_active?: number, gpt_api_key?: string} | null>(null);
  const [userPermissions, setUserPermissions] = useState<MenuPermission[]>([]);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [showBugReportModal, setShowBugReportModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({
    '대시보드 & 분석': false,
    '교인 관리': false,
    '재정 관리': false,
    '예배 & 소식': false,
    '교회 운영 & 설정': false,
    'AI 기능 (Premium)': false,
    '커뮤니티': false,
    '보안 & 시스템': false
  });
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // GPT 사용 권한 확인 함수
  const hasGPTAccess = () => {
    return churchInfo && (
      (churchInfo.gpt_licenses_active && churchInfo.gpt_licenses_active > 0) ||
      (churchInfo.gpt_api_key && churchInfo.gpt_api_key !== null)
    );
  };

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => {
      const isCurrentlyExpanded = prev[groupTitle];

      // 모든 그룹을 닫고, 클릭한 그룹이 닫혀있었다면 열기
      const newExpandedGroups: {[key: string]: boolean} = {};
      Object.keys(prev).forEach(key => {
        newExpandedGroups[key] = false;
      });

      if (!isCurrentlyExpanded) {
        newExpandedGroups[groupTitle] = true;
      }

      return newExpandedGroups;
    });
  };


  // 모바일 환경 체크
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024; // 태블릿 포함 1024px 미만을 모바일로 간주
      setShowMobileWarning(isMobile);
    };

    // 초기 체크
    checkMobile();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkMobile);

    // 클린업
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 경로 변경 시 관련 메뉴 그룹 자동 확장
  useEffect(() => {
    const currentPath = location.pathname;

    // 모든 그룹을 닫은 상태로 시작
    const newExpandedGroups: {[key: string]: boolean} = {
      '대시보드 & 분석': false,
      '교인 관리': false,
      '재정 관리': false,
      '예배 & 소식': false,
      '교회 운영 & 설정': false,
      'AI 기능 (Premium)': false,
      '커뮤니티': false,
      '보안 & 시스템': false
    };

    // 현재 경로에 해당하는 그룹 찾기 및 펼치기
    // 대시보드는 하위메뉴가 없으므로 그룹 펼치기 제외
    if (['/member-management', '/organization-management', '/attendance', '/pastoral-care', '/prayer-requests'].some(path => currentPath.startsWith(path))) {
      newExpandedGroups['교인 관리'] = true;
    } else if (['/accounting', '/account-categories', '/budget', '/settlement', '/donations'].some(path => currentPath.startsWith(path))) {
      newExpandedGroups['재정 관리'] = true;
    } else if (['/daily-verses', '/worship-schedule', '/bulletins', '/announcements', '/message-sending'].some(path => currentPath.startsWith(path))) {
      newExpandedGroups['예배 & 소식'] = true;
    } else if (['/church', '/important-dates', '/excel', '/sms', '/qr-codes'].some(path => currentPath.startsWith(path))) {
      newExpandedGroups['교회 운영 & 설정'] = true;
    } else if (['/ai-chat', '/ai-agent-management', '/sermon-library', '/ai-tools'].some(path => currentPath.startsWith(path))) {
      newExpandedGroups['AI 기능 (Premium)'] = true;
    } else if (currentPath.startsWith('/community')) {
      newExpandedGroups['커뮤니티'] = true;
    } else if (['/security-logs', '/system-announcements', '/system-announcements-list', '/sermons', '/church-applications', '/community-applications', '/church-management', '/gpt-license-management', '/church-gpt-license-assignment', '/admin-roles'].some(path => currentPath.startsWith(path))) {
      newExpandedGroups['보안 & 시스템'] = true;
    }

    setExpandedGroups(newExpandedGroups);
  }, [location.pathname]);

  useEffect(() => {
    // console.log('🔍 Layout 컴포넌트 마운트됨 - 사용자 정보 가져오기 시작');

    // Supabase로 현재 사용자 정보 가져오기
    const fetchUserInfo = async () => {
      try {
        // console.log('🌐 supabaseAuthService.getCurrentUser() 호출 중...');
        const result = await supabaseAuthService.getCurrentUser();
        // console.log('✅ Supabase 응답 받음:', result);

        if (!result) {
          // console.log('❌ 사용자 정보 없음 - 로그인 페이지로 이동');
          navigate('/login');
          return;
        }

        const user = result.user;

        const processedUser = {
          name: user.full_name || user.name || user.username || '사용자',
          email: user.email,
          church_id: user.church_id,
          role: normalizeRole(user.role), // 역할 정규화
          id: user.id
        };
        // console.log('📝 처리된 사용자 정보:', processedUser);

        setUserInfo(processedUser);

        // church_admin인 경우 권한 그룹 기반 권한 조회
        if (processedUser.role === 'church_admin' && processedUser.id) {
          try {
            const permissionsResult = await permissionGroupService.getUserPermissions(processedUser.id);
            setUserPermissions(permissionsResult.data || []);
            // console.log('✅ 사용자 권한 조회 성공:', permissionsResult.data);
          } catch (permError) {
            console.error('❌ 사용자 권한 조회 실패:', permError);
            setUserPermissions([]);
          }
        } else {
          // church_super_admin과 super_admin은 권한 체크 불필요
          setUserPermissions([]);
        }

        // 교회 정보 가져오기 (GPT 권한 확인용)
        if (user.church_id) {
          try {
            // console.log('🏛️ 교회 정보 조회 시작, church_id:', user.church_id);
            const { data: churchData, error: churchError } = await supabaseApiService.supabase
              .from('churches')
              .select('gpt_licenses_active, gpt_api_key')
              .eq('id', user.church_id)
              .single();

            if (churchError) {
              console.error('❌ 교회 정보 조회 실패:', churchError);
            } else {
              // console.log('✅ 교회 정보 조회 성공:', churchData);
              setChurchInfo(churchData);
            }
          } catch (churchError) {
            console.error('❌ 교회 정보 가져오기 오류:', churchError);
          }
        }
      } catch (error: unknown) {
        console.error('❌ 사용자 정보 가져오기 오류:', error);
        if (error && typeof error === 'object' && 'response' in error) {
          // console.log('🔍 오류 상세:', (error as any).response?.data);
        }
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await supabaseAuthService.signOut();
      navigate('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      navigate('/login'); // 오류가 있어도 로그인 페이지로 이동
    }
  };

  // 사용자 권한 확인 (새로운 5-tier 시스템 사용)
  const isSystemAdmin = userInfo ? isSuperAdmin(userInfo) : false;
  // Church ID 9998 사용자는 커뮤니티 전용 (교회 소속 없음)
  const isCommunityOnlyUser = userInfo ? userInfo.church_id === 9998 : false;

  // 아이콘 매핑
  const getIconByName = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      'Home': Home,
      'Gift': Gift,
      'MessageSquare': MessageSquare,
      'HandHeart': HandHeart,
      'Briefcase': Briefcase,
      'User': UserPlus,
      'Music': Music,
      'Users': Users2,
      'Calendar': Calendar,
      'UserCheck': UserCheck
    };
    return iconMap[iconName] || Home;
  };

  // 커뮤니티 전용 메뉴 그룹
  const communityMenuGroups: MenuGroup[] = [
    {
      title: '커뮤니티',
      items: getCommunityMenus().map(menu => ({
        path: menu.path,
        name: menu.name,
        Icon: getIconByName(menu.icon)
      })),
    },
  ];

  // 접근 가능한 메뉴 경로 목록
  const accessiblePaths = React.useMemo(() => {
    if (!userInfo) return [];
    return getAccessibleMenuPaths(userInfo, userPermissions);
  }, [userInfo, userPermissions]);

  // 메뉴 아이템 필터링 함수
  const filterMenuItems = (items: MenuGroup['items']): MenuGroup['items'] => {
    // church_admin이 아니거나 권한 체크가 필요없는 경우 모든 메뉴 표시
    if (!userInfo || !isChurchAdmin(userInfo) || accessiblePaths.length === 0) {
      return items;
    }

    // church_admin인 경우 권한이 있는 메뉴만 표시
    return items.filter(item => accessiblePaths.includes(item.path));
  };

  // 일반 교회/슈퍼어드민 메뉴 그룹
  const defaultMenuGroups: MenuGroup[] = React.useMemo(() => [
    {
      title: '대시보드 & 분석',
      items: [
        { path: '/dashboard', name: '대시보드', Icon: BarChart3 },
      ],
    },
    {
      title: '교인 관리',
      items: filterMenuItems([
        { path: '/member-management', name: '교인 관리', Icon: Users },
        { path: '/organization-management', name: '조직 관리', Icon: Building2 },
        { path: '/attendance', name: '출석 관리', Icon: CheckSquare },
        { path: '/pastoral-care', name: '심방 신청 관리', Icon: UserCheck },
        { path: '/prayer-requests', name: '중보기도 관리', Icon: Heart },
      ]),
    },
    {
      title: '재정 관리',
      items: filterMenuItems([
        { path: '/accounting', name: '회계 관리', Icon: Calculator },
        { path: '/account-categories', name: '계정 과목 관리', Icon: ListChecks },
        { path: '/budget', name: '예산 관리', Icon: TrendingUp },
        { path: '/settlement', name: '결산 관리', Icon: ChartLine },
        { path: '/donations', name: '헌금 관리', Icon: DollarSign },
      ]),
    },
    {
      title: '예배 & 소식',
      items: filterMenuItems([
        // { path: '/daily-verses', name: '오늘의 말씀', Icon: BookOpen },
        { path: '/worship-schedule', name: '예배 시간', Icon: Clock },
        { path: '/bulletins', name: '주보 관리', Icon: FileText },
        ...(isSystemAdmin ? [] : [{ path: '/announcements', name: '공지사항', Icon: Megaphone }]),
        { path: '/message-sending', name: '메시지 보내기', Icon: Bell },
      ]),
    },
    {
      title: '교회 운영 & 설정',
      items: filterMenuItems([
        { path: '/church', name: '교회 정보', Icon: Church },
        { path: '/important-dates', name: '일정 관리', Icon: Calendar },
        // { path: '/excel', name: '엑셀 관리', Icon: FileSpreadsheet },
        // { path: '/sms', name: 'SMS 발송', Icon: MessageSquare },
        // { path: '/qr-codes', name: 'QR 코드', Icon: QrCode },
      ]),
    },
    // GPT 권한이 있는 경우에만 AI 기능 메뉴 표시
    ...(hasGPTAccess() ? [{
      title: 'AI 기능 (Premium)',
      items: [
        { path: '/ai-chat', name: 'AI 교역자', Icon: Bot },
        { path: '/ai-agent-management', name: '에이전트 관리', Icon: Bot },
        { path: '/sermon-library', name: '설교 자료 관리', Icon: Library },
        { path: '/ai-tools', name: 'AI Tools', Icon: Wrench },
      ],
    }] : []),
    // {
    //   title: '커뮤니티',
    //   items: [
    //     { path: '/community/free-sharing', name: '무료 나눔(드림)', Icon: Gift },
    //     { path: '/community/item-sale', name: '물품 판매', Icon: ShoppingCart },
    //     { path: '/community/item-request', name: '물품 요청', Icon: HandHeart },
    //     { path: '/community/job-posting', name: '사역자 모집', Icon: Briefcase },
    //     { path: '/community/music-team-recruit', name: '행사팀 모집', Icon: Music },
    //     { path: '/community/music-team-seeking', name: '행사팀 지원', Icon: Users },
    //     { path: '/community/church-news', name: '행사 소식', Icon: Calendar },
    //     { path: '/community/my-posts', name: '내 글 관리', Icon: User },
    //     { path: '/community/wishlists', name: '내가 찜한 글', Icon: Heart },
    //     ...(isSystemAdmin ? [{ path: '/community/admin', name: '커뮤니티 관리', Icon: Shield }] : []),
    //   ],
    // },
    {
      title: '보안 & 시스템',
      items: [
        // church_super_admin에게만 보안 로그 표시
        ...(userInfo && isChurchSuperAdmin(userInfo) ? [
          { path: '/security-logs', name: '보안 로그', Icon: Shield }
        ] : []),
        // church_admin과 church_super_admin에게 시스템 공지사항 표시
        ...((userInfo && (isChurchAdmin(userInfo) || isChurchSuperAdmin(userInfo)) && !isSystemAdmin) ? [
          { path: '/system-announcements-list', name: '시스템 공지사항', Icon: Megaphone }
        ] : []),
        // super_admin에게는 모든 관리 메뉴 표시
        ...(isSystemAdmin ? [
          { path: '/security-logs', name: '보안 로그', Icon: Shield },
          { path: '/system-announcements', name: '시스템 공지사항 관리', Icon: Megaphone },
          { path: '/sermons', name: '명설교 관리', Icon: Video },
          { path: '/church-applications', name: '교회 가입 신청 관리', Icon: Church },
          { path: '/community-applications', name: '커뮤니티 신청 관리', Icon: UserCheck2 },
          { path: '/church-management', name: '교회 관리', Icon: Church },
          { path: '/gpt-license-management', name: 'GPT 라이선스 관리', Icon: Key }
        ] : []),
        // Church Super Admin에게만 권한 관리 메뉴 표시
        ...(userInfo && isChurchSuperAdmin(userInfo) ? [
          { path: '/admin-roles', name: '관리자 권한 관리', Icon: Shield },
          { path: '/permission-groups', name: '권한 그룹 관리', Icon: UserCog }
        ] : []),
      ],
    },
  ], [userInfo, isSystemAdmin, hasGPTAccess, filterMenuItems]);

  // 사용자 권한에 따라 메뉴 그룹 선택하고, 비어있는 그룹 제거
  const menuGroups = React.useMemo(() => {
    const baseMenuGroups = isCommunityOnlyUser ? communityMenuGroups : defaultMenuGroups;

    // items가 비어있는 그룹은 제거
    return baseMenuGroups.filter(group => group.items && group.items.length > 0);
  }, [isCommunityOnlyUser, communityMenuGroups, defaultMenuGroups]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Layout content */}
      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 z-40 flex flex-col",
          isSidebarOpen ? "w-64" : "w-16"
        )}>
          {/* 상단 계정 정보 및 토글 버튼 */}
          <div className="border-b border-slate-200 bg-white p-3">
            {isSidebarOpen ? (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                  {userInfo?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {userInfo?.name || '사용자'}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {userInfo?.email || ''}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex-shrink-0 text-slate-600 hover:text-slate-900 h-8 w-8"
                  title="사이드바 접기"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                  {userInfo?.name?.charAt(0) || 'U'}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(true)}
                  className="text-slate-600 hover:text-slate-900 h-8 w-8"
                  title="사이드바 펼치기"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto">
            {/* Main Menu Groups - 전체를 하나의 아코디언으로 */}
            <div className="bg-white overflow-hidden">
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex} className={cn(
                "relative",
                groupIndex > 0 && "border-t border-slate-200",
                groupIndex === menuGroups.length - 1 && "border-b border-slate-200"
              )}>
                {/* Group Header */}
                {group.title === '대시보드 & 분석' ? (
                  // 대시보드는 바로 이동
                  <Link
                    to="/dashboard"
                    className={cn(
                      "w-full flex items-center justify-between text-sm font-medium transition-all",
                      location.pathname === '/dashboard'
                        ? "bg-primary-500 text-white hover:bg-primary-600"
                        : "text-slate-600 hover:bg-slate-50",
                      isSidebarOpen ? "px-4 py-4" : "px-2 py-3 justify-center"
                    )}
                    title={!isSidebarOpen ? "대시보드" : undefined}
                  >
                    <div className={cn(
                      "flex items-center",
                      isSidebarOpen ? "gap-3" : "flex-col gap-1"
                    )}>
                      {/* 그룹 아이콘 - 첫 번째 아이템의 아이콘 사용 */}
                      {group.items && group.items[0] && (() => {
                        const IconComponent = group.items[0].Icon;
                        return <IconComponent className={cn(isSidebarOpen ? "h-5 w-5" : "h-6 w-6")} />;
                      })()}
                      {isSidebarOpen ? (
                        <span>대시보드</span>
                      ) : (
                        <span className="text-[10px]">홈</span>
                      )}
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      if (!isSidebarOpen) {
                        setIsSidebarOpen(true);
                      }
                      toggleGroup(group.title);
                    }}
                    onMouseEnter={() => !isSidebarOpen && setHoveredGroup(group.title)}
                    onMouseLeave={() => setHoveredGroup(null)}
                    className={cn(
                      "w-full flex items-center justify-between text-sm font-medium transition-all",
                      expandedGroups[group.title]
                        ? "bg-primary-500 text-white hover:bg-primary-600"
                        : "text-slate-600 hover:bg-slate-50",
                      isSidebarOpen ? "px-4 py-4" : "px-2 py-3 flex-col gap-1"
                    )}
                    title={!isSidebarOpen ? group.title : undefined}
                  >
                    <div className={cn(
                      "flex items-center",
                      isSidebarOpen ? "gap-3" : "flex-col gap-1"
                    )}>
                      {/* 그룹 아이콘 - 첫 번째 아이템의 아이콘 사용 */}
                      {group.items && group.items[0] && (() => {
                        const IconComponent = group.items[0].Icon;
                        return <IconComponent className={cn(isSidebarOpen ? "h-5 w-5" : "h-6 w-6")} />;
                      })()}
                      {isSidebarOpen ? (
                        <span>{group.title}</span>
                      ) : (
                        <span className="text-[10px] text-center leading-tight">{group.title.split(' ')[0]}</span>
                      )}
                    </div>
                    {isSidebarOpen && (
                      expandedGroups[group.title] ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4 -rotate-90" />
                      )
                    )}
                  </button>
                )}

                {/* Collapsed content - 대시보드는 하위메뉴 없음, 최소화 시 숨김 */}
                {group.title !== '대시보드 & 분석' && isSidebarOpen && (
                  <div
                    className={cn(
                      "bg-slate-50 grid transition-all duration-300 ease-in-out",
                      expandedGroups[group.title]
                        ? "grid-rows-[1fr]"
                        : "grid-rows-[0fr]"
                    )}
                  >
                    <div className="overflow-hidden">
                      {/* Regular Items */}
                      <div className="divide-y divide-slate-100">
                        {group.items && group.items.map((item, itemIndex) => {
                          const isActive = location.pathname === item.path;

                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              className={cn(
                                "flex items-center gap-3 py-3 text-sm font-normal transition-colors relative",
                                isActive
                                  ? "bg-primary-50 text-primary-700 pl-4 pr-4"
                                  : "text-slate-600 hover:bg-slate-50 pl-4 pr-4"
                              )}
                            >
                              {isActive && (
                                <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600"></span>
                              )}
                              {item.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover Popover - 축소 상태에서 호버 시 표시 */}
                {group.title !== '대시보드 & 분석' && !isSidebarOpen && hoveredGroup === group.title && (
                  <div
                    className="absolute left-full top-0 ml-2 min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-lg z-50"
                    onMouseEnter={() => setHoveredGroup(group.title)}
                    onMouseLeave={() => setHoveredGroup(null)}
                  >
                    {/* Popover Header */}
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                      <h3 className="text-sm font-semibold text-slate-900">{group.title}</h3>
                    </div>
                    {/* Popover Items */}
                    <div className="py-1">
                      {group.items && group.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        const ItemIcon = item.Icon;

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                              isActive
                                ? "bg-primary-50 text-primary-700 font-medium"
                                : "text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <ItemIcon className="h-4 w-4 flex-shrink-0" />
                            <span>{item.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          </nav>

          {/* 하단 고정 영역 */}
          <div className="border-t border-slate-200 bg-white">
            {/* 후원 계좌 정보 */}
            {isSidebarOpen && (
              <div className="p-3 border-b border-slate-200">
                <div className="mb-2">
                  <h3 className="text-xs font-semibold text-slate-900">후원 계좌</h3>
                </div>
                <p className="text-[10px] text-slate-600 mb-2 leading-relaxed">
                  Church Round의 발전을 위해 소중한 후원 부탁드립니다
                </p>
                <div className="bg-white rounded-md p-2 mb-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">은행</span>
                      <span className="text-xs font-medium text-slate-900">우리은행</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">예금주</span>
                      <span className="text-xs font-medium text-slate-900">이선민</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[10px] text-slate-500">계좌번호</span>
                      <span className="text-[11px] font-mono font-medium text-slate-900">326-252703-02-001</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 문의하기 & 로그아웃 버튼 */}
            <div className={cn("p-3 space-y-2", !isSidebarOpen && "flex flex-col items-center")}>
              {isSidebarOpen ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setShowBugReportModal(true)}
                    className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    문의하기
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowBugReportModal(true)}
                    className="text-slate-600 hover:text-slate-900 h-10 w-10"
                    title="문의하기"
                  >
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-slate-600 hover:text-slate-900 h-10 w-10"
                    title="로그아웃"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          isSidebarOpen ? "ml-64" : "ml-16"
        )}>
          <div className="p-6">
            <div className="max-w-full mx-auto">
              {/* 모바일 환경 경고 */}
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

              {/* 공지사항 모달 */}
              <AnnouncementModal />

              {/* Permission Provider로 Outlet 감싸기 */}
              <PermissionProvider user={userInfo} permissions={userPermissions}>
                <Outlet />
              </PermissionProvider>
            </div>
          </div>
        </main>
      </div>

      {/* 문의하기 모달 */}
      <BugReportModal open={showBugReportModal} onOpenChange={setShowBugReportModal} />
    </div>
  );
};

export default Layout;