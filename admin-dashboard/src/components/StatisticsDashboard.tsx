import React, { useState, useEffect } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Loader2,
  BarChart3,
  UserPlus
} from 'lucide-react';
import { Spinner } from './ui/spinner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "./ui";
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


// shadcn chart 설정
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

const StatisticsDashboard: React.FC = () => {
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [memberGrowth, setMemberGrowth] = useState<MemberGrowth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStatistics();
  }, []);

  const fetchAllStatistics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDemographics(),
        fetchMemberGrowth()
      ]);
    } catch (error) {
      console.error('통계 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDemographics = async () => {
    try {
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const functionsUrl = `${supabaseUrl}/functions/v1/statistics/members/demographics`;

      // 다른 Edge Function과 동일한 인증 패턴 사용
      const { supabaseAuthService } = await import('../services/supabaseAuthService');
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
      console.log('👥 Demographics API response:', data);
      console.log('🔍 Gender distribution received:', data.gender_distribution);
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

      // 다른 Edge Function과 동일한 인증 패턴 사용
      const { supabaseAuthService } = await import('../services/supabaseAuthService');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">통계 대시보드</h2>

        {/* API 연결 상태 알림 */}
        {(!demographics || !memberGrowth) && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <AlertTriangle className="w-4 h-4" />
            <span>통계 API 연결 중 문제가 발생했습니다. 기본 데이터를 표시합니다.</span>
          </div>
        )}
        
      </div>


      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
                  tickFormatter={(value) => value.slice(5)} // YYYY-MM -> MM
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
  );
};

export default StatisticsDashboard;