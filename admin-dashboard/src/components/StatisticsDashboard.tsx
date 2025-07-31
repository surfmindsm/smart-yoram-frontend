import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Users,
  BarChart3,
  TrendingUp,
  Calendar,
  Loader2,
  UserPlus,
  UserMinus,
  ArrowUp,
  ArrowDown
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
    present_count: number;
    total_members: number;
    attendance_rate: number;
  }>;
}

interface Demographics {
  gender_distribution: Array<{ gender: string; count: number }>;
  age_distribution: Array<{ age_group: string; count: number }>;
  position_distribution: Array<{ position: string; count: number }>;
  district_distribution: Array<{ district: string; count: number }>;
}

interface MemberGrowth {
  growth_data: Array<{
    month: string;
    new_members: number;
    transfers_out: number;
    net_growth: number;
    total_members: number;
  }>;
  summary: {
    total_new_members: number;
    total_transfers_out: number;
    net_growth: number;
    current_total_members: number;
  };
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
      const response = await api.get(
        `/statistics/attendance/summary?start_date=${dateRange.start_date}&end_date=${dateRange.end_date}&attendance_type=주일예배`
      );
      setAttendanceSummary(response.data);
    } catch (error) {
      console.error('출석 통계 조회 실패:', error);
    }
  };

  const fetchDemographics = async () => {
    try {
      const response = await api.get('/statistics/members/demographics');
      setDemographics(response.data);
    } catch (error) {
      console.error('인구통계 조회 실패:', error);
    }
  };

  const fetchMemberGrowth = async () => {
    try {
      const response = await api.get('/statistics/members/growth?months=12');
      setMemberGrowth(response.data);
    } catch (error) {
      console.error('교인 증가 통계 조회 실패:', error);
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
                      <Progress value={data.attendance_rate} className="w-32" />
                      <span className="text-sm font-medium text-foreground w-12">
                        {data.attendance_rate.toFixed(1)}%
                      </span>
                      <span className="text-sm text-muted-foreground w-16">
                        ({data.present_count}명)
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

        {/* 직분 분포 */}
        {demographics && demographics.position_distribution.length > 0 && (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-lg">직분 분포</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {demographics.position_distribution.map((item, index) => {
                  const maxCount = Math.max(...demographics.position_distribution.map(p => p.count));
                  const percentage = (item.count / maxCount * 100);
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.position}</span>
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
                  <UserPlus className="h-4 w-4 text-green-600" />
                  신규: {memberGrowth.summary.total_new_members}명
                </span>
                <span className="flex items-center gap-1">
                  <UserMinus className="h-4 w-4 text-red-600" />
                  이전: {memberGrowth.summary.total_transfers_out}명
                </span>
                <span className="flex items-center gap-1">
                  {memberGrowth.summary.net_growth >= 0 ? 
                    <ArrowUp className="h-4 w-4 text-green-600" /> : 
                    <ArrowDown className="h-4 w-4 text-red-600" />
                  }
                  순증가: {memberGrowth.summary.net_growth}명
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">신규</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">이전</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">순증가</th>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant="destructive">-{data.transfers_out}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Badge variant={data.net_growth >= 0 ? 'success' : 'destructive'}>
                          {data.net_growth >= 0 ? '+' : ''}{data.net_growth}
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