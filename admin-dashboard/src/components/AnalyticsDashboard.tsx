import React, { useState, useEffect } from 'react';
import { Button } from "./ui";
import { cn } from '../lib/utils';
import { analyticsService } from '../services/api';
import {
  BarChart3, TrendingUp, Users, MessageSquare, DollarSign,
  Calendar, ArrowUp, ArrowDown, Activity, Clock
} from 'lucide-react';

interface UsageStats {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  active_agents: number;
  period_growth: {
    requests: number;
    tokens: number;
    cost: number;
  };
}

interface AgentPerformance {
  id: string;
  name: string;
  requests: number;
  tokens: number;
  cost: number;
  avg_response_time: number;
  satisfaction_score?: number;
}

interface TopQuery {
  query: string;
  count: number;
  category: string;
}

interface TrendData {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'current_month'>('current_month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [usageStats, setUsageStats] = useState<UsageStats>({
    total_requests: 0,
    total_tokens: 0,
    total_cost: 0,
    active_agents: 0,
    period_growth: {
      requests: 0,
      tokens: 0,
      cost: 0
    }
  });
  
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [topQueries, setTopQueries] = useState<TopQuery[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUsageStats(),
        loadAgentPerformance(),
        loadTopQueries(),
        loadTrendAnalysis()
      ]);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError('분석 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const stats = await analyticsService.getUsageStats({ period });
      setUsageStats(stats);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const loadAgentPerformance = async () => {
    try {
      const performance = await analyticsService.getAgentPerformance();
      setAgentPerformance(performance);
    } catch (error) {
      console.error('Failed to load agent performance:', error);
    }
  };

  const loadTopQueries = async () => {
    try {
      const queries = await analyticsService.getTopQueries({ limit: 10, period });
      setTopQueries(queries);
    } catch (error) {
      console.error('Failed to load top queries:', error);
    }
  };

  const loadTrendAnalysis = async () => {
    try {
      const trends = await analyticsService.getTrendAnalysis({ 
        metric: 'requests', 
        period 
      });
      setTrendData(trends);
    } catch (error) {
      console.error('Failed to load trend analysis:', error);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    } else if (growth < 0) {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">사용량 분석</h1>
            <p className="text-slate-600">AI 에이전트 사용량 및 성능 분석 대시보드</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month' | 'current_month')}
              className="px-4 py-2 border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="week">최근 7일</option>
              <option value="current_month">이번 달</option>
              <option value="month">최근 30일</option>
            </select>
          </div>
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6 rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400">분석 데이터를 불러오는 중...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 주요 지표 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">총 요청수</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatNumber(usageStats.total_requests)}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex items-center mt-4 text-sm">
                {getGrowthIcon(usageStats.period_growth.requests)}
                <span className={cn("ml-1", getGrowthColor(usageStats.period_growth.requests))}>
                  {Math.abs(usageStats.period_growth.requests)}% 
                  {usageStats.period_growth.requests >= 0 ? ' 증가' : ' 감소'}
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">총 토큰 사용량</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatNumber(usageStats.total_tokens)}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-green-500" />
              </div>
              <div className="flex items-center mt-4 text-sm">
                {getGrowthIcon(usageStats.period_growth.tokens)}
                <span className={cn("ml-1", getGrowthColor(usageStats.period_growth.tokens))}>
                  {Math.abs(usageStats.period_growth.tokens)}% 
                  {usageStats.period_growth.tokens >= 0 ? ' 증가' : ' 감소'}
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">총 비용</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {formatCurrency(usageStats.total_cost)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="flex items-center mt-4 text-sm">
                {getGrowthIcon(usageStats.period_growth.cost)}
                <span className={cn("ml-1", getGrowthColor(usageStats.period_growth.cost))}>
                  {Math.abs(usageStats.period_growth.cost)}% 
                  {usageStats.period_growth.cost >= 0 ? ' 증가' : ' 감소'}
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">활성 에이전트</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {usageStats.active_agents}
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
              <div className="flex items-center mt-4 text-sm">
                <span className="text-slate-600">전체 에이전트</span>
              </div>
            </div>
          </div>

          {/* 에이전트 성능 분석 */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">에이전트별 성능</h3>
              <p className="text-sm text-slate-600 mt-1">각 에이전트의 사용량 및 성능 지표</p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 font-medium text-slate-700">에이전트</th>
                      <th className="text-right py-3 font-medium text-slate-700">요청수</th>
                      <th className="text-right py-3 font-medium text-slate-700">토큰</th>
                      <th className="text-right py-3 font-medium text-slate-700">비용</th>
                      <th className="text-right py-3 font-medium text-slate-700">평균 응답시간</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentPerformance.map((agent) => (
                      <tr key={agent.id} className="border-b border-slate-100">
                        <td className="py-4">
                          <div className="font-medium text-slate-900">{agent.name}</div>
                        </td>
                        <td className="text-right py-4 text-slate-600">
                          {formatNumber(agent.requests)}
                        </td>
                        <td className="text-right py-4 text-slate-600">
                          {formatNumber(agent.tokens)}
                        </td>
                        <td className="text-right py-4 text-slate-600">
                          {formatCurrency(agent.cost)}
                        </td>
                        <td className="text-right py-4 text-slate-600">
                          <div className="flex items-center justify-end">
                            <Clock className="h-4 w-4 mr-1" />
                            {agent.avg_response_time.toFixed(1)}s
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 인기 질문 */}
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">인기 질문</h3>
                <p className="text-sm text-slate-600 mt-1">가장 많이 질문된 내용들</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topQueries.map((query, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {query.query}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {query.category}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary-foreground">
                          {query.count}회
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 사용량 추이 */}
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">사용량 추이</h3>
                <p className="text-sm text-slate-600 mt-1">일별 사용량 변화</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {trendData.slice(-7).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="text-sm text-slate-700">
                        {new Date(trend.date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-slate-600">
                            {formatNumber(trend.requests)} 요청
                          </span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-slate-600">
                            {formatNumber(trend.tokens)} 토큰
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 요약 인사이트 */}
          <div className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-lg p-6 border border-primary/30">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 이번 달 인사이트</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium text-slate-900">가장 활발한 에이전트</span>
                </div>
                <p className="text-sm text-slate-600">
                  {agentPerformance.length > 0 ? agentPerformance[0].name : 'N/A'}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="font-medium text-slate-900">평균 응답시간</span>
                </div>
                <p className="text-sm text-slate-600">
                  {agentPerformance.length > 0 
                    ? (agentPerformance.reduce((sum, a) => sum + a.avg_response_time, 0) / agentPerformance.length).toFixed(1) + 's'
                    : 'N/A'
                  }
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <DollarSign className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="font-medium text-slate-900">일일 평균 비용</span>
                </div>
                <p className="text-sm text-slate-600">
                  {formatCurrency(usageStats.total_cost / (period === 'week' ? 7 : period === 'current_month' || period === 'month' ? 30 : 1))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
