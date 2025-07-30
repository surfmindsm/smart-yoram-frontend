import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">통계 대시보드</h2>
        
        {/* Date Range Selector */}
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">시작일</label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">종료일</label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {attendanceSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">총 교인 수</dt>
                    <dd className="text-lg font-medium text-gray-900">{attendanceSummary.summary.total_members}명</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">평균 출석</dt>
                    <dd className="text-lg font-medium text-gray-900">{attendanceSummary.summary.average_attendance.toFixed(1)}명</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">출석률</dt>
                    <dd className="text-lg font-medium text-gray-900">{attendanceSummary.summary.average_attendance_rate.toFixed(1)}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">통계 기간</dt>
                    <dd className="text-sm font-medium text-gray-900">
                      {attendanceSummary.attendance_data.length}주
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 출석 추이 */}
        {attendanceSummary && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">출석 추이</h3>
            <div className="space-y-2">
              {attendanceSummary.attendance_data.slice(-10).map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(data.date).toLocaleDateString('ko-KR')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${data.attendance_rate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {data.attendance_rate.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-500 w-16">
                      ({data.present_count}명)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 성별 분포 */}
        {demographics && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">성별 분포</h3>
            <div className="space-y-4">
              {demographics.gender_distribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{item.gender}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-pink-600'}`}
                        style={{ 
                          width: `${(item.count / demographics.gender_distribution.reduce((sum, g) => sum + g.count, 0) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900 w-12">{item.count}명</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 연령 분포 */}
        {demographics && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">연령 분포</h3>
            <div className="space-y-2">
              {demographics.age_distribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.age_group}세</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${item.count > 0 ? (item.count / Math.max(...demographics.age_distribution.map(a => a.count)) * 100) : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900 w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 직분 분포 */}
        {demographics && demographics.position_distribution.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">직분 분포</h3>
            <div className="space-y-2">
              {demographics.position_distribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{item.position}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ 
                          width: `${(item.count / Math.max(...demographics.position_distribution.map(p => p.count)) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900 w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 교인 증가 추이 */}
      {memberGrowth && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">교인 증가 추이 (최근 12개월)</h3>
            <div className="text-sm text-gray-600">
              신규: {memberGrowth.summary.total_new_members}명 | 
              이전: {memberGrowth.summary.total_transfers_out}명 | 
              순증가: {memberGrowth.summary.net_growth}명
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">월</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">신규</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이전</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">순증가</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총인원</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {memberGrowth.growth_data.slice(-6).map((data, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      +{data.new_members}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{data.transfers_out}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={data.net_growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {data.net_growth >= 0 ? '+' : ''}{data.net_growth}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.total_members}명
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatisticsDashboard;