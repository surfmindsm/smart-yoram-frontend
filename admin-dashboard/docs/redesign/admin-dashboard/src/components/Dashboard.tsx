import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { edgeApi } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import {
  Users,
  UserPlus,
  User,
  MessageSquare,
  QrCode,
  BarChart3,
  FileSpreadsheet,
  CheckSquare,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "./ui";
import { Badge } from "./ui";
import { Button } from "./ui";
import type { ChartConfig } from "./ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ComposedChart
} from 'recharts';
import { Spinner } from './ui/spinner';
import StatCard from './dashboard/StatCard';
import QuickActionCard from './dashboard/QuickActionCard';
import PasswordChangeModal from './PasswordChangeModal';
import { useToast } from '../contexts/ToastContext';

// Chart configurations
const genderChartConfig = {
  남성: {
    label: "남성",
    color: "hsl(var(--chart-1))",
  },
  여성: {
    label: "여성",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

const ageChartConfig = {
  count: {
    label: "인원수",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const memberGrowthConfig = {
  new_members: {
    label: "신규 교인",
    color: "hsl(var(--chart-1))",
  },
  total_members: {
    label: "총 교인 수",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

interface Demographics {
  gender_distribution: Array<{ gender: string; count: number; percentage: number }>;
  age_distribution: Array<{ age_group: string; count: number; percentage: number }>;
  total_members: number;
}

interface MemberGrowth {
  growth_data: Array<{
    month: string;
    new_members: number;
    total_members: number;
    growth_rate: number;
  }>;
  total_current_members: number;
  period_months: number;
}

const Dashboard = React.memo(() => {
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    todayAttendance: 0,
    newMembersThisWeek: 0,
    activeUsers: 1
  });
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [memberGrowth, setMemberGrowth] = useState<MemberGrowth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isTemporaryPassword, setIsTemporaryPassword] = useState(false);
  const { showToast } = useToast();

  const fetchDemographics = async () => {
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const functionsUrl = `${supabaseUrl}/functions/v1/statistics/members/demographics`;

      const token = await supabaseAuthService.getToken();

      const response = await fetch(functionsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setDemographics(data);
    } catch (error) {
      console.error('인구통계 조회 실패:', error);
      // 기본값 설정
      setDemographics({
        gender_distribution: [
          { gender: '남성', count: 0, percentage: 0 },
          { gender: '여성', count: 0, percentage: 0 }
        ],
        age_distribution: [
          { age_group: '10대', count: 0, percentage: 0 },
          { age_group: '20대', count: 0, percentage: 0 },
          { age_group: '30대', count: 0, percentage: 0 },
          { age_group: '40대', count: 0, percentage: 0 },
          { age_group: '50대', count: 0, percentage: 0 },
          { age_group: '60대 이상', count: 0, percentage: 0 }
        ],
        total_members: 0
      });
    }
  };

  const fetchMemberGrowth = async () => {
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const functionsUrl = `${supabaseUrl}/functions/v1/statistics/members/growth?months=12`;

      const token = await supabaseAuthService.getToken();

      const response = await fetch(functionsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setMemberGrowth(data);
    } catch (error) {
      console.error('교인 증가 통계 조회 실패:', error);
      // 기본값 설정
      const now = new Date();
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
          month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
          new_members: 0,
          total_members: 0,
          growth_rate: 0
        });
      }
      setMemberGrowth({
        growth_data: months,
        total_current_members: 0,
        period_months: 12
      });
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);

      // 현재 사용자 정보 가져오기 (church_id 필요)
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id;

      // 교인 데이터만 조회 (출석 데이터는 임시로 주석처리)
      const [membersResponse] = await Promise.all([
        edgeApi.get(`/members/${userChurchId ? `?church_id=${userChurchId}` : ''}`).catch(() => ({ data: [] })),
        fetchDemographics(),
        fetchMemberGrowth()
      ]);

      const totalMembers = membersResponse.data.length || 0;

      setDashboardData({
        totalMembers,
        todayAttendance: 0, // 임시로 0으로 설정 (출석 기능 비활성화)
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

  // 임시 비밀번호 체크
  useEffect(() => {
    const checkTemporaryPassword = async () => {
      try {
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (currentUser?.user) {
          // 임시 비밀번호 여부를 체크
          // TODO: users 테이블에 is_temporary_password 필드가 있다면 이를 사용
          // 지금은 비밀번호가 8자리 랜덤 문자열인지로 판단 (임시 비밀번호 생성 로직과 동일)
          const isTemp = currentUser.user.email &&
                        localStorage.getItem('temporary_password_login') === 'true';

          if (isTemp) {
            setIsTemporaryPassword(true);
            setShowPasswordModal(true);
            localStorage.removeItem('temporary_password_login'); // 한 번만 체크
          }
        }
      } catch (error) {
        console.error('임시 비밀번호 체크 오류:', error);
      }
    };

    checkTemporaryPassword();
  }, []);

  const handlePasswordChangeSuccess = () => {
    setShowPasswordModal(false);
    setIsTemporaryPassword(false);
    showToast('비밀번호가 성공적으로 변경되었습니다.', 'success');
  };

  const handlePasswordModalClose = () => {
    if (!isTemporaryPassword) {
      setShowPasswordModal(false);
    }
  };

  // stats 배열을 useMemo로 최적화
  const stats = useMemo(() => [
    { title: '전체 교인', value: dashboardData.totalMembers.toString(), Icon: Users, color: 'bg-blue-500' },
    // { title: '오늘 출석', value: dashboardData.todayAttendance.toString(), Icon: CheckCircle, color: 'bg-green-500' }, // 임시로 주석처리
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
              <Button
                onClick={fetchDashboardData}
                disabled={loading}
              >
                {loading ? '다시 로딩 중...' : '다시 시도'}
              </Button>
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
      
      {/* Stats Grid - 3개 카드로 더 넓게 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
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

      {/* Statistics Charts */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-foreground">통계 분석</h3>
          {(!demographics || !memberGrowth) && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              <AlertTriangle className="w-4 h-4" />
              <span>통계 API 연결 중 문제가 발생했습니다</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 성별 분포 */}
          {demographics && (
            <Card className="border-muted">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  성별 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={genderChartConfig}
                  className="mx-auto aspect-square max-h-[300px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={demographics.gender_distribution.filter(item => item.count > 0)}
                      dataKey="count"
                      nameKey="gender"
                      innerRadius={60}
                      strokeWidth={5}
                    >
                      <Cell fill="var(--color-남성)" />
                      <Cell fill="var(--color-여성)" />
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {demographics.gender_distribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: index === 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))' }}
                        />
                        <span className="text-sm font-medium">{item.gender}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{item.count}명</div>
                        <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 연령 분포 */}
          {demographics && (
            <Card className="border-muted">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  연령 분포
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={ageChartConfig}>
                  <BarChart
                    data={demographics.age_distribution.filter(item => item.count > 0)}
                    margin={{
                      left: 12,
                      right: 12,
                      top: 12,
                      bottom: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="age_group"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  {demographics.age_distribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground text-xs">{item.age_group}</span>
                      <div className="text-right">
                        <div className="font-medium">{item.count}명</div>
                        <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 교인 증가 추이 */}
        {memberGrowth && (
          <Card className="border-muted">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  교인 증가 추이 (최근 12개월)
                </CardTitle>
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    현재 교인: {memberGrowth.total_current_members}명
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    조회 기간: {memberGrowth.period_months}개월
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={memberGrowthConfig}
                className="min-h-[300px] w-full"
              >
                <ComposedChart
                  data={memberGrowth.growth_data.slice(-12)}
                  margin={{
                    left: 12,
                    right: 12,
                    top: 12,
                    bottom: 12,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(5)}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="new_members"
                    fill="var(--color-new_members)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    dataKey="total_members"
                    type="monotone"
                    stroke="var(--color-total_members)"
                    strokeWidth={2}
                    dot={{
                      fill: "var(--color-total_members)",
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />
                </ComposedChart>
              </ChartContainer>

              {/* 요약 통계 */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    +{memberGrowth.growth_data.reduce((sum, item) => sum + item.new_members, 0)}
                  </div>
                  <div className="text-sm text-green-700">총 신규 교인</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {memberGrowth.total_current_members}명
                  </div>
                  <div className="text-sm text-blue-700">현재 총 교인</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {memberGrowth.growth_data.slice(-3).reduce((sum, item) => sum + item.new_members, 0)}
                  </div>
                  <div className="text-sm text-purple-700">최근 3개월 신규</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 비밀번호 변경 모달 */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={handlePasswordModalClose}
        onSuccess={handlePasswordChangeSuccess}
        isTemporaryPassword={isTemporaryPassword}
      />
    </div>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;