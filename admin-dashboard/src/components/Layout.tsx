import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { loginHistoryService } from '../services/api';
import AnnouncementModal from './AnnouncementModal';
import {
  BarChart3,
  ChartLine,
  Users,
  MessageSquare,
  QrCode,
  FileSpreadsheet,
  CheckSquare,
  FileText,
  Church,
  Menu,
  LogOut,
  Megaphone,
  BookOpen,
  X,
  Heart,
  Clock,
  Bell,
  Bot,
  Settings,
  TrendingUp,
  UserCheck,
  Wrench,
  DollarSign,
  Library,
  Shield,
  Monitor,
  MapPin,
  Users2,
  Share2,
  Gift,
  HandHeart,
  Briefcase,
  UserPlus,
  Music,
  Mic,
  Calendar,
  Sparkles,
  Home,
  ChevronDown,
  ChevronRight,
  UserCheck2,
  ShoppingCart,
  User,
  Key,
  UserCog
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui";
import {
  isCommunityAdmin,
  isSuperAdmin,
  getCommunityMenus,
  normalizeRole,
  canAccessAdminDashboard,
  isMember,
  isChurchSuperAdmin,
  isChurchAdmin
} from '../utils/userPermissions';

interface MenuSubGroup {
  title: string;
  items: Array<{
    path: string;
    name: string;
    Icon: React.ComponentType<any>;
  }>;
}

interface MenuGroup {
  title: string;
  hasSubGroups?: boolean;
  subGroups?: MenuSubGroup[];
  items?: Array<{
    path: string;
    name: string;
    Icon: React.ComponentType<any>;
  }>;
}

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userInfo, setUserInfo] = useState<{name?: string, email?: string, church_id?: number, role?: string} | null>(null);
  const [recentLogin, setRecentLogin] = useState<any>(null);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<{[key: string]: boolean}>({
    '대시보드 & 분석': true, // 대시보드는 기본으로 열어두기
    '교인 관리': false,
    '재정 관리': false,
    '예배 & 소식': false,
    '교회 운영 & 설정': false,
    'AI 기능 (Premium)': false,
    '커뮤니티': true, // 커뮤니티 섹션은 기본으로 열어두기
    '보안 & 시스템': false
  });
  const [expandedSubGroups, setExpandedSubGroups] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();
  const location = useLocation();

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const toggleSubGroup = (subGroupKey: string) => {
    setExpandedSubGroups(prev => ({
      ...prev,
      [subGroupKey]: !prev[subGroupKey]
    }));
  };

  useEffect(() => {
    console.log('🔍 Layout 컴포넌트 마운트됨 - 사용자 정보 가져오기 시작');

    // Supabase로 현재 사용자 정보 가져오기
    const fetchUserInfo = async () => {
      try {
        console.log('🌐 supabaseAuthService.getCurrentUser() 호출 중...');
        const result = await supabaseAuthService.getCurrentUser();
        console.log('✅ Supabase 응답 받음:', result);

        if (!result) {
          console.log('❌ 사용자 정보 없음 - 로그인 페이지로 이동');
          navigate('/login');
          return;
        }

        const user = result.user;

        const processedUser = {
          name: user.full_name || user.name || user.username || '사용자',
          email: user.email,
          church_id: user.church_id,
          role: normalizeRole(user.role) // 역할 정규화
        };
        console.log('📝 처리된 사용자 정보:', processedUser);

        setUserInfo(processedUser);

        // 최근 로그인 기록 가져오기 (일단 스킵 - 기존 API 의존성)
        try {
          // const recentLoginData = await loginHistoryService.getRecentLogin();
          // setRecentLogin(recentLoginData);
          console.log('📝 로그인 기록 조회는 일시적으로 비활성화됨');
        } catch (loginError) {
          console.error('로그인 기록 조회 실패:', loginError);
        }
      } catch (error: unknown) {
        console.error('❌ 사용자 정보 가져오기 오류:', error);
        if (error && typeof error === 'object' && 'response' in error) {
          console.log('🔍 오류 상세:', (error as any).response?.data);
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

  // 로그인 히스토리 모달 열기
  const handleOpenLoginHistory = async () => {
    try {
      const response = await loginHistoryService.getLoginHistory();
      setLoginHistory(response.records || []);
      setShowLoginHistoryModal(true);
    } catch (error) {
      console.error('로그인 기록 조회 실패:', error);
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

  // 일반 교회/슈퍼어드민 메뉴 그룹
  const defaultMenuGroups: MenuGroup[] = [
    {
      title: '대시보드 & 분석',
      items: [
        { path: '/dashboard', name: '대시보드', Icon: BarChart3 },
        { path: '/statistics', name: '통계 분석', Icon: ChartLine },
      ],
    },
    {
      title: '교인 관리',
      items: [
        { path: '/member-management', name: '교인 관리', Icon: Users },
        { path: '/attendance', name: '출석 관리', Icon: CheckSquare },
        { path: '/pastoral-care', name: '심방 신청 관리', Icon: UserCheck },
        { path: '/prayer-requests', name: '중보 기도 요청', Icon: Heart },
      ],
    },
    {
      title: '재정 관리',
      items: [
        { path: '/donations', name: '헌금 관리', Icon: DollarSign },
      ],
    },
    {
      title: '예배 & 소식',
      items: [
        { path: '/daily-verses', name: '오늘의 말씀', Icon: BookOpen },
        { path: '/worship-schedule', name: '예배 시간', Icon: Clock },
        { path: '/bulletins', name: '주보 관리', Icon: FileText },
        ...(isSystemAdmin ? [] : [{ path: '/announcements', name: '공지사항', Icon: Megaphone }]),
        { path: '/push-notifications', name: '푸시 알림', Icon: Bell },
      ],
    },
    {
      title: '교회 운영 & 설정',
      items: [
        { path: '/church', name: '교회 정보', Icon: Church },
        { path: '/excel', name: '엑셀 관리', Icon: FileSpreadsheet },
        { path: '/sms', name: 'SMS 발송', Icon: MessageSquare },
        { path: '/qr-codes', name: 'QR 코드', Icon: QrCode },
      ],
    },
    {
      title: 'AI 기능 (Premium)',
      items: [
        { path: '/ai-chat', name: 'AI 교역자', Icon: Bot },
        { path: '/ai-agent-management', name: '에이전트 관리', Icon: Bot },
        { path: '/sermon-library', name: '설교 자료 관리', Icon: Library },
        { path: '/ai-tools', name: 'AI Tools', Icon: Wrench },
      ],
    },
    {
      title: '커뮤니티',
      hasSubGroups: true,
      subGroups: [
        {
          title: '물품 거래',
          items: [
            { path: '/community/free-sharing', name: '무료 나눔(드림)', Icon: Gift },
            { path: '/community/item-sale', name: '물품 판매', Icon: ShoppingCart },
            { path: '/community/item-request', name: '물품 요청', Icon: HandHeart },
          ]
        },
        {
          title: '인력 매칭',
          items: [
            { path: '/community/job-posting', name: '사역자 모집', Icon: Briefcase },
            { path: '/community/music-team-recruit', name: '행사팀 모집', Icon: Music },
            { path: '/community/music-team-seeking', name: '행사팀 지원', Icon: Users },
          ]
        },
        {
          title: '소식 · 관리',
          items: [
            { path: '/community/church-news', name: '행사 소식', Icon: Calendar },
            { path: '/community/my-posts', name: '내 글 관리', Icon: User },
            { path: '/community/wishlists', name: '내가 찜한 글', Icon: Heart },
          ]
        }
      ],
      items: [
        ...(isSystemAdmin ? [{ path: '/community/admin', name: '커뮤니티 관리', Icon: Shield }] : []),
      ],
    },
    {
      title: '보안 & 시스템',
      items: [
        { path: '/security-logs', name: '보안 로그', Icon: Shield },
        ...(isSystemAdmin ? [
          { path: '/system-announcements', name: '시스템 공지사항', Icon: Megaphone },
          { path: '/community-applications', name: '커뮤니티 신청 관리', Icon: UserCheck2 },
          { path: '/church-management', name: '교회 관리', Icon: Church },
          { path: '/gpt-license-management', name: 'GPT 라이선스 관리', Icon: Key }
        ] : []),
        // Church Super Admin에게만 GPT 라이선스 할당 메뉴 표시
        ...(userInfo && isChurchSuperAdmin(userInfo) ? [{ path: '/church-gpt-license-assignment', name: 'GPT 라이선스 할당', Icon: UserCog }] : []),
        // Church Super Admin에게만 권한 관리 메뉴 표시
        ...(userInfo && isChurchSuperAdmin(userInfo) ? [{ path: '/admin-roles', name: '관리자 권한 관리', Icon: Shield }] : []),
      ],
    },
  ];

  // 사용자 권한에 따라 메뉴 그룹 선택
  const menuGroups = isCommunityOnlyUser ? communityMenuGroups : defaultMenuGroups;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 fixed w-full top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-4"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-slate-900">
              {isCommunityOnlyUser ? 'Church Round 커뮤니티' : 'Church Round 관리자'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* 최근 접속 기록 버튼 */}
            {recentLogin && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-3 py-2"
                onClick={handleOpenLoginHistory}
              >
                <Clock className="w-4 h-4" />
                <div className="text-sm">최근 접속 기록</div>
              </Button>
            )}

            {/* 사용자 정보 */}
            {userInfo ? (
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">
                  {userInfo.name}
                </div>
                <div className="text-xs text-slate-500">
                  {userInfo.email}
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-sm text-slate-400">
                  로딩 중...
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-900"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Layout content */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className={cn(
          "fixed left-0 top-16 h-full bg-white border-r border-slate-200 transition-transform duration-300 overflow-y-auto z-40",
          isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
        )}>
          <nav className="p-4 space-y-6">
            {/* Main Menu Groups */}
            {menuGroups.map((group, groupIndex) => (
              <div key={groupIndex}>
                {/* Separator line between categories (except for the first one) */}
                {groupIndex > 0 && (
                  <div className="border-t border-slate-100 mb-4"></div>
                )}

                {/* Group Header - 모든 그룹을 접을 수 있도록 수정 */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between mb-2 px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
                >
                  <span>{group.title}</span>
                  {expandedGroups[group.title] ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>

                {/* Collapsed content */}
                {expandedGroups[group.title] && (
                  <>
                    {/* Regular Items */}
                    <div className="space-y-1">
                      {group.items && group.items.map((item) => {
                        const isActive = location.pathname === item.path;

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            )}
                          >
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Sub Groups */}
                    {group.hasSubGroups && group.subGroups && (
                      <div className="ml-4 space-y-4 mt-2">
                        {group.subGroups.map((subGroup, subIndex) => {
                          const subGroupKey = `${group.title}-${subGroup.title}`;
                          return (
                            <div key={subIndex}>
                              <button
                                onClick={() => toggleSubGroup(subGroupKey)}
                                className="w-full flex items-center justify-between mb-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                              >
                                <span>{subGroup.title}</span>
                                {expandedSubGroups[subGroupKey] ? (
                                  <ChevronDown className="h-3 w-3" />
                                ) : (
                                  <ChevronRight className="h-3 w-3" />
                                )}
                              </button>

                              {expandedSubGroups[subGroupKey] && (
                                <div className="space-y-1">
                                  {subGroup.items.map((item) => {
                                    const isActive = location.pathname === item.path;

                                    return (
                                      <Link
                                        key={item.path}
                                        to={item.path}
                                        className={cn(
                                          "flex items-center px-2 py-1.5 rounded-md text-sm font-medium transition-colors",
                                          isActive
                                            ? "bg-primary/10 text-primary"
                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                        )}
                                      >
                                        {item.name}
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

          </nav>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          isSidebarOpen ? "ml-64" : "ml-0"
        )}>
          <div className="p-3">
            <div className="max-w-full mx-auto">
              {/* 공지사항 모달 */}
              <AnnouncementModal />

              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* 로그인 기록 모달 */}
      <Dialog open={showLoginHistoryModal} onOpenChange={setShowLoginHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              로그인 기록
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loginHistory.length > 0 ? (
              <>
                <div className="mb-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold text-blue-600">{loginHistory.length}</span>개의 로그인 기록이 검색되었습니다.
                  </div>
                </div>

                {/* 테이블 형태로 변경 */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-3 text-left font-medium text-gray-900 w-16">번호</th>
                          <th className="px-3 py-3 text-left font-medium text-gray-900 w-40">접속 시간</th>
                          <th className="px-3 py-3 text-left font-medium text-gray-900 w-24">디바이스</th>
                          <th className="px-3 py-3 text-left font-medium text-gray-900 w-32">접속아이피</th>
                          <th className="px-3 py-3 text-left font-medium text-gray-900">접속위치</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {loginHistory.map((login, index) => (
                          <tr key={login.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-3 text-gray-900 text-center">{loginHistory.length - index}</td>
                            <td className="px-3 py-3 text-gray-900 text-xs">
                              {new Date(login.timestamp).toLocaleDateString('ko-KR', {
                                month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                              })}
                            </td>
                            <td className="px-3 py-3 text-gray-600 text-center text-xs">
                              {login.device_type || 'desktop'}
                            </td>
                            <td className="px-3 py-3 text-gray-600 font-mono text-xs">
                              {login.ip_address}
                            </td>
                            <td className="px-3 py-3 text-gray-600 text-xs">
                              {login.location || '위치 정보 없음'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">로그인 기록이 없습니다</p>
                <p className="text-sm text-gray-500">백엔드 API가 연결되면 기록이 표시됩니다</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">보안 팁</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 익숙하지 않은 로그인 기록이 있다면 즉시 비밀번호를 변경하세요</li>
                    <li>• 공용 컴퓨터에서는 로그아웃을 반드시 해주세요</li>
                    <li>• 정기적으로 로그인 기록을 확인하는 것을 권장합니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Layout;