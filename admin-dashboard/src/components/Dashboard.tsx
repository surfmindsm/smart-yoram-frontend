import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertTriangle,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "./ui";
import { Badge } from "./ui";
import { Button } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui";
import type { ChartConfig } from "./ui/chart";
import { getPositionMainLabel, getPositionDetailLabel } from '../constants/memberPositions';
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
import TodoList from './dashboard/TodoList';
import PasswordChangeModal from './PasswordChangeModal';
import QuickActionsCustomizer from './dashboard/QuickActionsCustomizer';
import { useToast } from '../hooks/use-toast';
import { AVAILABLE_QUICK_ACTIONS, DEFAULT_QUICK_ACTIONS, QuickAction } from '../constants/quickActions';

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

interface TodoData {
  todayBirthdays: any[];
  upcomingBirthdays: any[];
  todayPastoralCare: any[];
  upcomingPastoralCare: any[];
  upcomingImportantDates: any[];
}

const Dashboard = React.memo(() => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    totalMembers: 0,
    todayAttendance: 0,
    newMembersThisWeek: 0,
    activeUsers: 1
  });
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [memberGrowth, setMemberGrowth] = useState<MemberGrowth | null>(null);
  const [todos, setTodos] = useState<TodoData>({
    todayBirthdays: [],
    upcomingBirthdays: [],
    todayPastoralCare: [],
    upcomingPastoralCare: [],
    upcomingImportantDates: []
  });
  const [loading, setLoading] = useState(true);
  const [todosLoading, setTodosLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isTemporaryPassword, setIsTemporaryPassword] = useState(false);
  const [showQuickActionsCustomizer, setShowQuickActionsCustomizer] = useState(false);
  const [selectedQuickActionIds, setSelectedQuickActionIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('quickActionIds');
    return saved ? JSON.parse(saved) : DEFAULT_QUICK_ACTIONS;
  });
  const { toast } = useToast();

  // Todo item 다이얼로그 상태
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [showPastoralCareDialog, setShowPastoralCareDialog] = useState(false);
  const [showImportantDateDialog, setShowImportantDateDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedPastoralCare, setSelectedPastoralCare] = useState<any>(null);
  const [selectedImportantDate, setSelectedImportantDate] = useState<any>(null);

  // Todo item 클릭 핸들러
  const handleMemberClick = (member: any) => {
    setSelectedMember(member);
    setShowMemberDialog(true);
  };

  const handlePastoralCareClick = (care: any) => {
    setSelectedPastoralCare(care);
    setShowPastoralCareDialog(true);
  };

  const handleImportantDateClick = (event: any) => {
    setSelectedImportantDate(event);
    setShowImportantDateDialog(true);
  };

  const handlePastoralCareNavigate = () => {
    navigate('/pastoral-care');
  };

  const fetchDemographics = async () => {
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const functionsUrl = `${supabaseUrl}/functions/v1/statistics/members/demographics`;

      const token = await supabaseAuthService.getToken();
      const currentUser = await supabaseAuthService.getCurrentUser();

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

  const fetchTodos = useCallback(async () => {
    try {
      setTodosLoading(true);
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const functionsUrl = `${supabaseUrl}/functions/v1/dashboard-todos`;

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

      setTodos({
        todayBirthdays: data.todayBirthdays || [],
        upcomingBirthdays: data.upcomingBirthdays || [],
        todayPastoralCare: data.todayPastoralCare || [],
        upcomingPastoralCare: data.upcomingPastoralCare || [],
        upcomingImportantDates: data.upcomingImportantDates || []
      });
    } catch (error) {
      console.error('Todo 목록 조회 실패:', error);
    } finally {
      setTodosLoading(false);
    }
  }, []);

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
        fetchMemberGrowth(),
        fetchTodos()
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
  }, [fetchTodos]);

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
    const toastInstance = toast({
      title: '비밀번호 변경 완료',
      description: '비밀번호가 성공적으로 변경되었습니다',
    });
    setTimeout(() => toastInstance.dismiss(), 2000);
  };

  const handlePasswordModalClose = () => {
    if (!isTemporaryPassword) {
      setShowPasswordModal(false);
    }
  };

  // stats 배열을 useMemo로 최적화
  const stats = useMemo(() => [
    { title: '전체 교인', value: dashboardData.totalMembers.toString(), Icon: Users, color: 'bg-primary-500' },
    // { title: '오늘 출석', value: dashboardData.todayAttendance.toString(), Icon: CheckCircle, color: 'bg-green-500' }, // 임시로 주석처리
    { title: '이번 주 새가족', value: dashboardData.newMembersThisWeek.toString(), Icon: UserPlus, color: 'bg-purple-500' },
    { title: '활성 사용자', value: dashboardData.activeUsers.toString(), Icon: User, color: 'bg-yellow-500' },
  ], [dashboardData]);

  // quickActions를 선택된 항목으로 필터링
  const quickActions = useMemo(() => {
    return selectedQuickActionIds
      .map(id => AVAILABLE_QUICK_ACTIONS.find(action => action.id === id))
      .filter((action): action is QuickAction => action !== undefined);
  }, [selectedQuickActionIds]);

  // 빠른 작업 저장 핸들러
  const handleSaveQuickActions = (newSelectedIds: string[]) => {
    setSelectedQuickActionIds(newSelectedIds);
    localStorage.setItem('quickActionIds', JSON.stringify(newSelectedIds));
    toast({
      title: '설정 저장 완료',
      description: '빠른 작업 설정이 저장되었습니다',
    });
  };

  // 에러가 있으면 에러 메시지 표시
  if (error) {
    return (
      <PageContainer>
        <PageHeader title="대시보드" />
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
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="대시보드" />

      {/* Todo List */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          {/* <Calendar className="h-5 w-5" /> */}
          <h3 className="text-lg font-semibold text-foreground">할 일 목록</h3>
          {(todos.todayBirthdays.length + todos.upcomingBirthdays.length +
            todos.todayPastoralCare.length + todos.upcomingPastoralCare.length +
            todos.upcomingImportantDates.length) > 0 && (
            <Badge variant="default" className="bg-primary-500">
              {todos.todayBirthdays.length + todos.upcomingBirthdays.length +
               todos.todayPastoralCare.length + todos.upcomingPastoralCare.length +
               todos.upcomingImportantDates.length}
            </Badge>
          )}
        </div>
        <TodoList
          todayBirthdays={todos.todayBirthdays}
          upcomingBirthdays={todos.upcomingBirthdays}
          todayPastoralCare={todos.todayPastoralCare}
          upcomingPastoralCare={todos.upcomingPastoralCare}
          upcomingImportantDates={todos.upcomingImportantDates}
          loading={todosLoading}
          onMemberClick={handleMemberClick}
          onPastoralCareClick={handlePastoralCareClick}
          onImportantDateClick={handleImportantDateClick}
          onPastoralCareNavigate={handlePastoralCareNavigate}
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">빠른 작업</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickActionsCustomizer(true)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            커스터마이징
          </Button>
        </div>
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

      {/* Stats Grid - 교인 통계 카드 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">교인 통계 카드</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                {demographics.total_members > 0 ? (
                  <>
                    <ChartContainer
                      config={genderChartConfig}
                      className="mx-auto aspect-square max-h-[200px]"
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
                          innerRadius={40}
                          strokeWidth={4}
                        >
                          <Cell fill="var(--color-남성)" />
                          <Cell fill="var(--color-여성)" />
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <Users className="h-12 w-12 mb-2 opacity-20" />
                    <p className="text-sm">등록된 교인이 없습니다</p>
                  </div>
                )}
                {demographics.total_members > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {demographics.gender_distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: index === 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-2))' }}
                          />
                          <span className="text-xs font-medium">{item.gender}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{item.count}명</div>
                          <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                {demographics.total_members > 0 ? (
                  <>
                    <ChartContainer config={ageChartConfig} className="h-[200px]">
                      <BarChart
                        data={demographics.age_distribution.filter(item => item.count > 0)}
                        margin={{
                          left: 8,
                          right: 8,
                          top: 8,
                          bottom: 8,
                        }}
                      >
                        <CartesianGrid vertical={false} />
                        <XAxis
                          dataKey="age_group"
                          tickLine={false}
                          tickMargin={8}
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
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                    <p className="text-sm">등록된 교인이 없습니다</p>
                  </div>
                )}
                {demographics.total_members > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {demographics.age_distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-1.5 rounded bg-muted/30">
                        <span className="text-muted-foreground text-xs">{item.age_group}</span>
                        <div className="text-right">
                          <div className="text-xs font-medium">{item.count}명</div>
                          <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                className="h-[200px] w-full"
              >
                <ComposedChart
                  data={memberGrowth.growth_data.slice(-12)}
                  margin={{
                    left: 8,
                    right: 8,
                    top: 8,
                    bottom: 8,
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
                    type="linear"
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
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="text-xl font-bold text-green-600">
                    +{memberGrowth.growth_data.reduce((sum, item) => sum + item.new_members, 0)}
                  </div>
                  <div className="text-xs text-green-700">총 신규 교인</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary-50 border border-primary-200">
                  <div className="text-xl font-bold text-primary-600">
                    {memberGrowth.total_current_members}명
                  </div>
                  <div className="text-xs text-primary-700">현재 총 교인</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="text-xl font-bold text-purple-600">
                    {memberGrowth.growth_data.slice(-3).reduce((sum, item) => sum + item.new_members, 0)}
                  </div>
                  <div className="text-xs text-purple-700">최근 3개월 신규</div>
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

      {/* 빠른 작업 커스터마이저 */}
      <QuickActionsCustomizer
        open={showQuickActionsCustomizer}
        onOpenChange={setShowQuickActionsCustomizer}
        selectedIds={selectedQuickActionIds}
        onSave={handleSaveQuickActions}
      />

      {/* 교인 상세 다이얼로그 */}
      <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>교인 정보</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">이름</p>
                <p className="font-medium">{selectedMember.name}</p>
              </div>
              {selectedMember.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">연락처</p>
                  <p className="font-medium">{selectedMember.phone}</p>
                </div>
              )}
              {selectedMember.birthdate && (
                <div>
                  <p className="text-sm text-muted-foreground">생년월일</p>
                  <p className="font-medium">{selectedMember.birthdate}</p>
                </div>
              )}
              {selectedMember.daysUntil !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">생일까지</p>
                  <p className="font-medium">{selectedMember.daysUntil}일 남음</p>
                </div>
              )}
              {(selectedMember.position_main || selectedMember.position_detail) && (
                <div>
                  <p className="text-sm text-muted-foreground">직분</p>
                  <p className="font-medium">
                    {[
                      getPositionMainLabel(selectedMember.position_main),
                      getPositionDetailLabel(selectedMember.position_detail)
                    ].filter(Boolean).join(' / ')}
                  </p>
                </div>
              )}
              {selectedMember.department && (
                <div>
                  <p className="text-sm text-muted-foreground">부서</p>
                  <p className="font-medium">{selectedMember.department}</p>
                </div>
              )}
              {selectedMember.church_organizations?.name && (
                <div>
                  <p className="text-sm text-muted-foreground">조직</p>
                  <p className="font-medium">{selectedMember.church_organizations.name}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMemberDialog(false)}>
              닫기
            </Button>
            <Button onClick={() => {
              setShowMemberDialog(false);
              navigate('/member-management', { state: { memberId: selectedMember?.id, action: 'view' } });
            }}>
              자세히 보기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 심방 상세 다이얼로그 */}
      <Dialog open={showPastoralCareDialog} onOpenChange={setShowPastoralCareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>심방 정보</DialogTitle>
          </DialogHeader>
          {selectedPastoralCare && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">신청자</p>
                <p className="font-medium">
                  {selectedPastoralCare.members?.name || selectedPastoralCare.requester_name}
                </p>
              </div>
              {(selectedPastoralCare.members?.phone || selectedPastoralCare.requester_phone) && (
                <div>
                  <p className="text-sm text-muted-foreground">연락처</p>
                  <p className="font-medium">
                    {selectedPastoralCare.members?.phone || selectedPastoralCare.requester_phone}
                  </p>
                </div>
              )}
              {(selectedPastoralCare.scheduled_date || selectedPastoralCare.preferred_date) && (
                <div>
                  <p className="text-sm text-muted-foreground">일정</p>
                  <p className="font-medium">
                    {selectedPastoralCare.scheduled_date || selectedPastoralCare.preferred_date}
                    {selectedPastoralCare.scheduled_time && ` ${selectedPastoralCare.scheduled_time}`}
                  </p>
                </div>
              )}
              {(selectedPastoralCare.members?.position_main || selectedPastoralCare.members?.position_detail) && (
                <div>
                  <p className="text-sm text-muted-foreground">직분</p>
                  <p className="font-medium">
                    {[
                      getPositionMainLabel(selectedPastoralCare.members?.position_main),
                      getPositionDetailLabel(selectedPastoralCare.members?.position_detail)
                    ].filter(Boolean).join(' / ')}
                  </p>
                </div>
              )}
              {selectedPastoralCare.members?.department && (
                <div>
                  <p className="text-sm text-muted-foreground">부서</p>
                  <p className="font-medium">{selectedPastoralCare.members.department}</p>
                </div>
              )}
              {selectedPastoralCare.members?.church_organizations?.name && (
                <div>
                  <p className="text-sm text-muted-foreground">조직</p>
                  <p className="font-medium">{selectedPastoralCare.members.church_organizations.name}</p>
                </div>
              )}
              {selectedPastoralCare.address && (
                <div>
                  <p className="text-sm text-muted-foreground">주소</p>
                  <p className="font-medium">{selectedPastoralCare.address}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPastoralCareDialog(false)}>
              닫기
            </Button>
            <Button onClick={() => {
              setShowPastoralCareDialog(false);
              navigate('/pastoral-care', { state: { requestId: selectedPastoralCare?.id, action: 'complete' } });
            }}>
              자세히 보기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 중요 일정 상세 다이얼로그 */}
      <Dialog open={showImportantDateDialog} onOpenChange={setShowImportantDateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>일정</DialogTitle>
          </DialogHeader>
          {selectedImportantDate && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">제목</p>
                <p className="font-medium">{selectedImportantDate.title}</p>
              </div>
              {selectedImportantDate.event_type && (
                <div>
                  <p className="text-sm text-muted-foreground">일정 유형</p>
                  <p className="font-medium">{selectedImportantDate.event_type}</p>
                </div>
              )}
              {selectedImportantDate.event_date && (
                <div>
                  <p className="text-sm text-muted-foreground">일정 날짜</p>
                  <p className="font-medium">{selectedImportantDate.event_date}</p>
                </div>
              )}
              {selectedImportantDate.daysUntil !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">D-day</p>
                  <p className="font-medium">
                    {selectedImportantDate.daysUntil === 0 ? 'D-Day' : `D-${selectedImportantDate.daysUntil}`}
                  </p>
                </div>
              )}
              {selectedImportantDate.members?.name && (
                <div>
                  <p className="text-sm text-muted-foreground">관련 교인</p>
                  <p className="font-medium">{selectedImportantDate.members.name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">메모</p>
                <p className="font-medium">{selectedImportantDate.notes || '메모 없음'}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportantDateDialog(false)}>
              닫기
            </Button>
            <Button onClick={() => {
              setShowImportantDateDialog(false);
              navigate('/important-dates', { state: { dateId: selectedImportantDate?.id, action: 'view' } });
            }}>
              자세히 보기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
});

Dashboard.displayName = 'Dashboard';

export default Dashboard;