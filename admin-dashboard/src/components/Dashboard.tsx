import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { cn } from '../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState([
    { title: '전체 교인', value: '0', Icon: Users, color: 'bg-blue-500' },
    { title: '오늘 출석', value: '0', Icon: CheckCircle, color: 'bg-green-500' },
    { title: '이번 주 새가족', value: '0', Icon: UserPlus, color: 'bg-purple-500' },
    { title: '활성 사용자', value: '0', Icon: User, color: 'bg-yellow-500' },
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch members count
      const membersResponse = await api.get('/members/');
      const totalMembers = membersResponse.data.length;
      
      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const attendanceResponse = await api.get(`/attendances/?start_date=${today}&end_date=${today}`);
      const todayAttendance = attendanceResponse.data.filter((a: any) => a.is_present).length;

      // Update stats
      setStats([
        { title: '전체 교인', value: totalMembers.toString(), Icon: Users, color: 'bg-blue-500' },
        { title: '오늘 출석', value: todayAttendance.toString(), Icon: CheckCircle, color: 'bg-green-500' },
        { title: '이번 주 새가족', value: '0', Icon: UserPlus, color: 'bg-purple-500' },
        { title: '활성 사용자', value: '1', Icon: User, color: 'bg-yellow-500' },
      ]);
    } catch (error) {
      console.error('대시보드 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
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
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">대시보드</h2>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.Icon;
          return (
            <Card key={index} className="border-muted">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={cn("p-3 rounded-lg", stat.color.replace('bg-', 'bg-') + '/10')}>
                    <IconComponent className={cn("h-6 w-6", stat.color.replace('bg-', 'text-'))} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">빠른 작업</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const IconComponent = action.Icon;
            return (
              <Link key={index} to={action.link}>
                <Card className="border-muted hover:shadow-md transition-shadow duration-200 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className={cn("p-3 rounded-lg", action.color.replace('bg-', 'bg-') + '/10')}>
                        <IconComponent className={cn("h-6 w-6", action.color.replace('bg-', 'text-'))} />
                      </div>
                      <div className="ml-4">
                        <h4 className="text-lg font-medium text-foreground">{action.title}</h4>
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
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
};

export default Dashboard;