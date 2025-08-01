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
  Clock
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

  const menuItems = [
    { path: '/dashboard', name: '대시보드', Icon: BarChart3 },
    { path: '/statistics', name: '통계 분석', Icon: ChartLine },
    { path: '/member-management', name: '교인 관리', Icon: Users },
    { path: '/announcements', name: '공지사항', Icon: Megaphone },
    { path: '/daily-verses', name: '오늘의 말씀', Icon: BookOpen },
    { path: '/worship-schedule', name: '예배 시간', Icon: Clock },
    { path: '/sms', name: 'SMS 발송', Icon: MessageSquare },
    { path: '/qr-codes', name: 'QR 코드', Icon: QrCode },
    { path: '/excel', name: '엑셀 관리', Icon: FileSpreadsheet },
    { path: '/attendance', name: '출석 관리', Icon: CheckSquare },
    { path: '/bulletins', name: '주보 관리', Icon: FileText },
    { path: '/church', name: '교회 정보', Icon: Church },
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
              {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
            {menuItems.map((item) => {
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
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;