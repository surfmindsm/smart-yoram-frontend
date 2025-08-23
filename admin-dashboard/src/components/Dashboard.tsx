import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import {
  Users,
  CheckCircle,
  UserPlus,
  User,
  MessageSquare,
  QrCode,
  BarChart3,
  FileSpreadsheet,
  CheckSquare,
  Activity,
  Smartphone,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import StatCard from './dashboard/StatCard';
import QuickActionCard from './dashboard/QuickActionCard';

const Dashboard = React.memo(() => {
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    todayAttendance: 0,
    newMembersThisWeek: 0,
    activeUsers: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      
      // 병렬로 API 호출하여 성능 개선
      const today = new Date().toISOString().split('T')[0];
      const [membersResponse, attendanceResponse] = await Promise.all([
        api.get('/members/').catch(() => ({ data: [] })),
        api.get(`/attendances/?start_date=${today}&end_date=${today}`).catch(() => ({ data: [] }))
      ]);
      
      const totalMembers = membersResponse.data.length || 0;
      const todayAttendance = attendanceResponse.data?.filter((a: any) => a.is_present)?.length || 0;

      setDashboardData({
        totalMembers,
        todayAttendance,
        newMembersThisWeek: 0, // TODO: 실제 로직 구현
        activeUsers: 1
      });
    } catch (error) {
      console.error('대시보드 데이터 조회 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // stats 배열을 useMemo로 최적화
  const stats = useMemo(() => [
    { title: '전체 교인', value: dashboardData.totalMembers.toString(), Icon: Users, color: 'bg-blue-500' },
    { title: '오늘 출석', value: dashboardData.todayAttendance.toString(), Icon: CheckCircle, color: 'bg-green-500' },
    { title: '이번 주 새가족', value: dashboardData.newMembersThisWeek.toString(), Icon: UserPlus, color: 'bg-purple-500' },
    { title: '활성 사용자', value: dashboardData.activeUsers.toString(), Icon: User, color: 'bg-yellow-500' },
  ], [dashboardData]);

  // quickActions를 useMemo로 최적화 (정적 데이터이므로)
  const quickActions = useMemo(() => [
    {
      title: '교인 등록',
      description: '새로운 교인을 등록합니다',
      Icon: UserPlus,
      link: '/member-management',
      color: 'bg-blue-500'
    },
    {
      title: 'SMS 발송',
      description: '교인들에게 단체 메시지를 발송합니다',
      Icon: MessageSquare,
      link: '/sms',
      color: 'bg-green-500'
    },
    {
      title: 'QR 코드 생성',
      description: '출석체크용 QR 코드를 생성합니다',
      Icon: QrCode,
      link: '/qr-codes',
      color: 'bg-purple-500'
    },
    {
      title: '통계 조회',
      description: '출석 및 교인 통계를 확인합니다',
      Icon: BarChart3,
      link: '/statistics',
      color: 'bg-yellow-500'
    },
    {
      title: '엑셀 관리',
      description: '교인 명단을 업로드/다운로드합니다',
      Icon: FileSpreadsheet,
      link: '/excel',
      color: 'bg-indigo-500'
    },
    {
      title: '출석 관리',
      description: '출석 기록을 관리합니다',
      Icon: CheckSquare,
      link: '/attendance',
      color: 'bg-red-500'
    }
  ], []);

  // 에러가 있으면 에러 메시지 표시
  if (error) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">대시보드</h2>
        </div>
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? '다시 로딩 중...' : '다시 시도'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">대시보드</h2>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard
            key={`stat-${index}`}
            title={stat.title}
            value={stat.value}
            Icon={stat.Icon}
            color={stat.color}
            loading={loading}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">빠른 작업</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={`action-${action.title}-${index}`}
              title={action.title}
              description={action.description}
              Icon={action.Icon}
              link={action.link}
              color={action.color}
            />
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-foreground">최근 활동</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center mr-3">
              <Activity className="h-4 w-4 text-green-600" />
            </div>
            <span>새로운 기능들이 추가되었습니다!</span>
            <Badge variant="success" className="ml-auto">신규</Badge>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center mr-3">
              <Smartphone className="h-4 w-4 text-blue-600" />
            </div>
            <span>QR 코드 출석 체크 시스템이 활성화되었습니다.</span>
            <Badge variant="default" className="ml-auto">활성</Badge>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center mr-3">
              <MessageCircle className="h-4 w-4 text-purple-600" />
            </div>
            <span>SMS 발송 기능을 사용할 수 있습니다.</span>
            <Badge variant="outline" className="ml-auto">준비</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;