import React, { useState, useEffect } from 'react';
import {
  Shield,
  MapPin,
  Search,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Globe,
  Users,
  Eye,
} from 'lucide-react';
import {
  Card,
  LoadingState,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  PageContainer,
} from "./ui";
import { Pagination } from './common/Pagination';
import { StandardPagination } from '../types';
import { supabaseApiService } from '../services/supabaseApiService';
import { formatDateTime as formatDateTimeUtil } from '../utils/dateUtils';
import { usePageSubtitle, usePageActions } from '../hooks/usePageSubtitle';
import { cn } from '../lib/utils';

interface LoginRecord {
  id: number;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: 'login' | 'logout' | 'failed_login';
  ip_address: string;
  browser: string;
  location?: string;
  success: boolean;
  session_duration?: number;
  details?: any;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  resource_id?: string;
  ip_address: string;
  user_agent?: string;
  church_id?: number;
  details?: {
    page_name?: string;
    target_name?: string;
    sensitive_data_count?: number;
    page_path?: string;
    session_id?: string;
    sensitive_data?: string[];
    [key: string]: any;
  };
}

const SecurityLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'activity'>('login');
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');

  const [loginPagination, setLoginPagination] = useState<StandardPagination>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20,
    has_next: false,
    has_prev: false,
  });

  const [activityPagination, setActivityPagination] = useState<StandardPagination>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20,
    has_next: false,
    has_prev: false,
  });

  const [stats, setStats] = useState({
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    uniqueUsers: 0,
    suspiciousActivities: 0,
  });

  const getFilterParams = () => {
    const params: any = {};
    if (searchTerm) params.search = searchTerm;
    if (statusFilter !== 'all') {
      if (statusFilter === 'success') params.action = 'login,logout';
      else if (statusFilter === 'failed') params.action = 'failed_login';
    }
    const now = new Date();
    if (dateFilter === 'today') {
      const today = now.toISOString().split('T')[0];
      params.start_date = today;
      params.end_date = today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      params.start_date = weekAgo.toISOString().split('T')[0];
      params.end_date = now.toISOString().split('T')[0];
    }
    return params;
  };

  const fetchLoginRecords = async (page: number = loginPagination.current_page) => {
    try {
      const response = await supabaseApiService.securityLogs.getLoginRecords({
        ...getFilterParams(),
        page,
        limit: loginPagination.per_page,
      });
      setLoginRecords(response.data || []);
      if (response.total !== undefined) {
        const totalPages = Math.ceil(response.total / loginPagination.per_page);
        setLoginPagination({
          current_page: page,
          total_pages: totalPages,
          total_count: response.total,
          per_page: loginPagination.per_page,
          has_next: page < totalPages,
          has_prev: page > 1,
        });
      }
    } catch (error) {
      console.error('로그인 기록 조회 실패:', error);
      setLoginRecords([]);
    }
  };

  const fetchActivityLogs = async (page: number = activityPagination.current_page) => {
    try {
      const response = await supabaseApiService.securityLogs.getActivityLogs({
        ...getFilterParams(),
        page,
        limit: activityPagination.per_page,
      });
      setActivityLogs(response.data || []);
      if (response.total !== undefined) {
        const totalPages = Math.ceil(response.total / activityPagination.per_page);
        setActivityPagination({
          current_page: page,
          total_pages: totalPages,
          total_count: response.total,
          per_page: activityPagination.per_page,
          has_next: page < totalPages,
          has_prev: page > 1,
        });
      }
    } catch (error) {
      console.error('활동 로그 조회 실패:', error);
      setActivityLogs([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await supabaseApiService.securityLogs.getStats({ ...getFilterParams() });
      const data = response.data;
      setStats({
        totalLogins: data.total_logins || 0,
        successfulLogins: data.successful_logins || 0,
        failedLogins: data.failed_logins || 0,
        uniqueUsers: data.unique_users || 0,
        suspiciousActivities: data.failed_logins || 0,
      });
    } catch (error) {
      console.error('통계 조회 실패:', error);
      setStats({ totalLogins: 0, successfulLogins: 0, failedLogins: 0, uniqueUsers: 0, suspiciousActivities: 0 });
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        activeTab === 'login' ? fetchLoginRecords() : fetchActivityLogs(),
      ]);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchTerm, statusFilter, dateFilter]);

  const handleRefresh = () => loadData();

  const getStatusChipClass = (action: 'login' | 'logout' | 'failed_login') => {
    if (action === 'failed_login') return 'bg-[#FCEBEB] text-[#DC2626]';
    if (action === 'login') return 'bg-[#E7F6EC] text-[#16A34A]';
    return 'bg-[#F1F4F9] text-[#64748B]';
  };

  const getStatusLabel = (action: 'login' | 'logout' | 'failed_login') => {
    if (action === 'failed_login') return '실패';
    if (action === 'login') return '로그인';
    return '로그아웃';
  };

  const getActionChipClass = (action: string) => {
    const colors: Record<string, string> = {
      view: 'bg-[#EAF1FE] text-[#2563EB]',
      create: 'bg-[#E7F6EC] text-[#16A34A]',
      update: 'bg-[#FBF1E3] text-[#B45309]',
      delete: 'bg-[#FCEBEB] text-[#DC2626]',
      search: 'bg-[#F3E8FF] text-[#7E22CE]',
    };
    return colors[action] || 'bg-[#F1F4F9] text-[#64748B]';
  };

  const handleLoginPageChange = (page: number) => fetchLoginRecords(page);
  const handleLoginLimitChange = (limit: number) => {
    setLoginPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchLoginRecords(1);
  };
  const handleActivityPageChange = (page: number) => fetchActivityLogs(page);
  const handleActivityLimitChange = (limit: number) => {
    setActivityPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    fetchActivityLogs(1);
  };

  // 상단바
  usePageSubtitle(`전체 ${activeTab === 'login' ? loginPagination.total_count : activityPagination.total_count}건`);
  usePageActions(
    <>
      <Button variant="outline" size="sm" className="gap-2">
        <Download className="h-3.5 w-3.5" />
        엑셀 내보내기
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleRefresh}
        disabled={loading}
      >
        <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin text-primary')} />
        새로고침
      </Button>
    </>,
    [loading, loginPagination.total_count, activityPagination.total_count, activeTab]
  );

  return (
    <PageContainer>
      {/* 통계 KPI strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card>
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#EAF1FE] text-[#2563EB]">
              <Shield className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground">전체 로그인</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-foreground">
                {stats.totalLogins}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#E7F6EC] text-[#16A34A]">
              <CheckCircle className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground">성공</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-[#16A34A]">
                {stats.successfulLogins}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FCEBEB] text-[#DC2626]">
              <XCircle className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground">실패</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-[#DC2626]">
                {stats.failedLogins}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#F3E8FF] text-[#7E22CE]">
              <Users className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground">활성 사용자</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-foreground">
                {stats.uniqueUsers}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FBF1E3] text-[#B45309]">
              <AlertTriangle className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground">의심 활동</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-[#B45309]">
                {stats.suspiciousActivities}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 탭 — 헌금/조직/심방과 동일한 언더라인 스타일 */}
      <div className="mb-4 inline-flex items-center gap-1 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab('login')}
          className={cn(
            'relative px-4 py-2.5 text-[13px] font-semibold transition-colors',
            activeTab === 'login'
              ? 'text-foreground after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          로그인 기록
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={cn(
            'relative px-4 py-2.5 text-[13px] font-semibold transition-colors',
            activeTab === 'activity'
              ? 'text-foreground after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[2px] after:bg-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          활동 로그
        </button>
      </div>

      <Card className="overflow-hidden">
        {/* 검색 + 필터 바 */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF1F6] px-[16px] py-[14px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              type="text"
              placeholder={activeTab === 'login' ? '사용자 또는 IP' : '사용자 또는 대상'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 md:w-[320px]"
            />
          </div>

          <div className="flex-1" />

          {activeTab === 'login' && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-[38px] w-auto min-w-[140px] gap-2">
                <span className="text-[12.5px] text-muted-foreground">상태</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="success">성공</SelectItem>
                <SelectItem value="failed">실패</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-[38px] w-auto min-w-[140px] gap-2">
              <span className="text-[12.5px] text-muted-foreground">기간</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">오늘</SelectItem>
              <SelectItem value="week">최근 7일</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 */}
        {loading ? (
          <LoadingState text={activeTab === 'login' ? '로그인 기록을 불러오는 중...' : '활동 로그를 불러오는 중...'} />
        ) : activeTab === 'login' ? (
          loginRecords.length === 0 ? (
            <div className="py-12 text-center">
              <Shield className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
              <h3 className="mb-2 text-[15px] font-bold text-foreground">로그인 기록이 없습니다</h3>
              <p className="text-[13px] text-muted-foreground">필터 조건이나 기간을 조정해보세요.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[180px]" />
                    <col />
                    <col className="w-[100px]" />
                    <col className="w-[160px]" />
                    <col className="w-[180px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">시간</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">사용자</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">상태</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">IP 주소</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">위치</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F4F9] bg-card">
                    {loginRecords.map((record) => (
                      <tr key={record.id} className="transition-colors hover:bg-[#F8FAFD]">
                        <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                          {formatDateTimeUtil(record.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-foreground truncate" title={record.user_name}>
                          {record.user_name || '알 수 없음'}
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                            getStatusChipClass(record.action)
                          )}>
                            {getStatusLabel(record.action)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                          <span className="inline-flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-[#94A3B8]" />
                            {record.ip_address}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-foreground truncate">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-[#94A3B8]" />
                            {record.location || <span className="text-[#CBD5E1]">-</span>}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loginRecords.length > 0 && (
                <div className="border-t border-[#EEF1F6] px-4 py-3">
                  <Pagination
                    currentPage={loginPagination.current_page}
                    totalPages={loginPagination.total_pages}
                    itemsPerPage={loginPagination.per_page}
                    totalItems={loginPagination.total_count}
                    onPageChange={handleLoginPageChange}
                    onItemsPerPageChange={handleLoginLimitChange}
                    itemsPerPageOptions={[10, 20, 50, 100]}
                  />
                </div>
              )}
            </>
          )
        ) : (
          // 활동 로그 탭
          activityLogs.length === 0 ? (
            <div className="py-12 text-center">
              <Eye className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
              <h3 className="mb-2 text-[15px] font-bold text-foreground">활동 로그가 없습니다</h3>
              <p className="text-[13px] text-muted-foreground">사용자 활동이 기록되면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-[180px]" />
                    <col className="w-[140px]" />
                    <col className="w-[100px]" />
                    <col className="w-[120px]" />
                    <col />
                    <col className="w-[100px]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">시간</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">사용자</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">액션</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">리소스</th>
                      <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">대상 · 페이지</th>
                      <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">민감정보</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F4F9] bg-card">
                    {activityLogs.map((log) => (
                      <tr key={log.id} className="transition-colors hover:bg-[#F8FAFD]">
                        <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                          {formatDateTimeUtil(log.timestamp)}
                        </td>
                        <td className="px-4 py-3 text-[13px] font-semibold text-foreground truncate" title={log.user_name}>
                          {log.user_name || '알 수 없음'}
                        </td>
                        <td className="px-4 py-3 text-[13px]">
                          <span className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                            getActionChipClass(log.action)
                          )}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[13px] text-foreground truncate">
                          {log.resource}
                        </td>
                        <td className="px-4 py-3 text-[13px] text-foreground truncate" title={log.details?.target_name || log.details?.page_name || ''}>
                          {log.details?.target_name || log.details?.page_name || <span className="text-[#CBD5E1]">-</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-[13px] text-foreground tabular-nums">
                          {log.details?.sensitive_data_count
                            ? <span className="font-semibold text-[#B45309]">{log.details.sensitive_data_count}개</span>
                            : <span className="text-[#CBD5E1]">0</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {activityLogs.length > 0 && (
                <div className="border-t border-[#EEF1F6] px-4 py-3">
                  <Pagination
                    currentPage={activityPagination.current_page}
                    totalPages={activityPagination.total_pages}
                    itemsPerPage={activityPagination.per_page}
                    totalItems={activityPagination.total_count}
                    onPageChange={handleActivityPageChange}
                    onItemsPerPageChange={handleActivityLimitChange}
                    itemsPerPageOptions={[10, 20, 50, 100]}
                  />
                </div>
              )}
            </>
          )
        )}
      </Card>
    </PageContainer>
  );
};

export default SecurityLogs;
