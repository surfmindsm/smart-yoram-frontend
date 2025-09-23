import React, { useState, useEffect } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import {
  Users,
  BarChart3,
  TrendingUp,
  Calendar,
  Loader2,
  UserPlus,
  UserMinus,
  ArrowUp,
  ArrowDown,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

interface AttendanceSummary {
  summary: {
    total_members: number;
    average_attendance: number;
    average_attendance_rate: number;
    period: {
      start_date: string;
      end_date: string;
    };
  };
  attendance_data: Array<{
    date: string;
    count: number;
    attendance_type: string;
  }>;
}

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
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [memberGrowth, setMemberGrowth] = useState<MemberGrowth | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90일 전
    end_date: new Date().toISOString().split('T')[0] // 오늘
  });

  useEffect(() => {
    fetchAllStatistics();
  }, [dateRange]);

  const fetchAllStatistics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAttendanceSummary(),
        fetchDemographics(),
        fetchMemberGrowth()
      ]);
    } catch (error) {
      console.error('통계 데이터 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const params = new URLSearchParams({
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        attendance_type: '주일예배'
      });

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const functionsUrl = `${supabaseUrl}/functions/v1/statistics/attendance/summary?${params.toString()}`;

      // 다른 Edge Function과 동일한 인증 패턴 사용
      const { supabaseAuthService } = await import('../services/supabaseAuthService');
      const token = await supabaseAuthService.getToken();

      console.log('🔐 Token check:', {
        hasToken: !!token,
        tokenPrefix: token?.substring(0, 20),
        fullToken: token
      });

      const response = await fetch(functionsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token || '',
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Attendance response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('📊 Attendance error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Attendance data received:', data);
      setAttendanceSummary(data);
    } catch (error) {
      console.error('출석 통계 조회 실패:', error);
      // 기본값 설정
      setAttendanceSummary({
        summary: {
          total_members: 0,
          average_attendance: 0,
          average_attendance_rate: 0,
          period: {
            start_date: dateRange.start_date,
            end_date: dateRange.end_date
          }
        },
        attendance_data: []
      });
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
        <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">통계 대시보드</h2>

        {/* API 연결 상태 알림 */}
        {(!attendanceSummary || !demographics || !memberGrowth) && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <AlertTriangle className="w-4 h-4" />
            <span>통계 API 연결 중 문제가 발생했습니다. 기본 데이터를 표시합니다.</span>
          </div>
        )}
        
        {/* Date Range Selector */}
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              시작일
            </label>
            <Input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              종료일
            </label>
            <Input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {attendanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-muted">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">총 교인 수</dt>
                    <dd className="text-lg font-medium text-foreground">{attendanceSummary.summary.total_members}명</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">평균 출석</dt>
                    <dd className="text-lg font-medium text-foreground">{attendanceSummary.summary.average_attendance.toFixed(1)}명</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">출석률</dt>
                    <dd className="text-lg font-medium text-foreground">{attendanceSummary.summary.average_attendance_rate.toFixed(1)}%</dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">통계 기간</dt>
                    <dd className="text-sm font-medium text-foreground">
                      {attendanceSummary.attendance_data.length}주
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 출석 추이 */}
        {attendanceSummary && (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-lg">출석 추이</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {attendanceSummary.attendance_data.slice(-10).map((data, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {new Date(data.date).toLocaleDateString('ko-KR')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Progress value={attendanceSummary?.summary.total_members ? (data.count / attendanceSummary.summary.total_members) * 100 : 0} className="w-32" />
                      <span className="text-sm font-medium text-foreground w-12">
                        {attendanceSummary?.summary.total_members ? ((data.count / attendanceSummary.summary.total_members) * 100).toFixed(1) : 0}%
                      </span>
                      <span className="text-sm text-muted-foreground w-16">
                        ({data.count}명)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 성별 분포 */}
        {demographics && (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-lg">성별 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demographics.gender_distribution.map((item, index) => {
                  const percentage = (item.count / demographics.gender_distribution.reduce((sum, g) => sum + g.count, 0) * 100);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{item.gender}</span>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={percentage} 
                          className="w-24"
                        />
                        <span className="text-sm text-foreground w-12">{item.count}명</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 연령 분포 */}
        {demographics && (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-lg">연령 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {demographics.age_distribution.map((item, index) => {
                  const maxCount = Math.max(...demographics.age_distribution.map(a => a.count));
                  const percentage = item.count > 0 ? (item.count / maxCount * 100) : 0;
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.age_group}세</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={percentage} className="w-20" />
                        <span className="text-sm text-foreground w-8">{item.count}</span>
                      </div>
                    </div>
                  );
                })}
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
              <CardTitle className="text-lg">교인 증가 추이 (최근 12개월)</CardTitle>
              <div className="text-sm text-muted-foreground flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  현재 교인: {memberGrowth.total_current_members}명
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  조회 기간: {memberGrowth.period_months}개월
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">월</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">신규 교인</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">증가율</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">총인원</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {memberGrowth.growth_data.slice(-6).map((data, index) => (
                    <tr key={index} className="hover:bg-muted/30">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {data.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant="success">+{data.new_members}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Badge variant={data.growth_rate >= 0 ? 'success' : 'destructive'}>
                          {data.growth_rate >= 0 ? '+' : ''}{data.growth_rate}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {data.total_members}명
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatisticsDashboard;