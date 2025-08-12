import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
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
  Clock,
  Bell,
  Bot,
  Settings,
  TrendingUp,
  Heart,
  UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const generalMenuItems = [
    { path: '/dashboard', name: '대시보드', Icon: BarChart3 },
    { path: '/statistics', name: '통계 분석', Icon: ChartLine },
    { path: '/member-management', name: '교인 관리', Icon: Users },
    { path: '/announcements', name: '공지사항', Icon: Megaphone },
    { path: '/pastoral-care', name: '심방 신청 관리', Icon: UserCheck },
    { path: '/prayer-requests', name: '중보 기도 요청', Icon: Heart },
    { path: '/daily-verses', name: '오늘의 말씀', Icon: BookOpen },
    { path: '/worship-schedule', name: '예배 시간', Icon: Clock },
    { path: '/push-notifications', name: '푸시 알림', Icon: Bell },
    { path: '/sms', name: 'SMS 발송', Icon: MessageSquare },
    { path: '/qr-codes', name: 'QR 코드', Icon: QrCode },
    { path: '/excel', name: '엑셀 관리', Icon: FileSpreadsheet },
    { path: '/attendance', name: '출석 관리', Icon: CheckSquare },
    { path: '/bulletins', name: '주보 관리', Icon: FileText },
    { path: '/church', name: '교회 정보', Icon: Church },
    { path: '/church-settings', name: '시스템 설정', Icon: Settings },
  ];

  const aiMenuItems = [
    { path: '/analytics', name: 'AI 사용량 분석', Icon: TrendingUp },
    { path: '/ai-chat', name: 'AI 교역자', Icon: Bot },
    { path: '/ai-agent-management', name: '에이전트 관리', Icon: Bot },
    { path: '/gpt-settings', name: 'GPT 설정', Icon: Settings },
  ];

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
            <h1 className="text-xl font-semibold text-slate-900">스마트 요람 관리자</h1>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-slate-600 hover:text-slate-900"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-white border-r border-slate-200 transition-all duration-300 fixed h-full z-40",
            isSidebarOpen ? "w-64" : "w-0 overflow-hidden"
          )}
        >
          <nav className="p-4 space-y-1">
            {/* 일반 메뉴 */}
            {generalMenuItems.map((item: { path: string; name: string; Icon: React.ElementType }) => {
              const IconComponent = item.Icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sky-50 text-sky-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <IconComponent className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-sky-600" : "text-slate-400"
                  )} />
                  {item.name}
                </Link>
              );
            })}
            
            {/* AI 메뉴 구분선 */}
            <div className="border-t border-slate-200 my-4"></div>
            <div className="px-3 py-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                AI 기능
              </h3>
            </div>
            
            {/* AI 관련 메뉴 */}
            {aiMenuItems.map((item: { path: string; name: string; Icon: React.ElementType }) => {
              const IconComponent = item.Icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sky-50 text-sky-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <IconComponent className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-sky-600" : "text-slate-400"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          isSidebarOpen ? "ml-64" : "ml-0"
        )}>
          <div className="p-3">
            <div className="max-w-full mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;