import React, { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Globe,
  Users,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { Button } from "./ui";
import { Input } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Badge } from "./ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui";
import { Spinner } from "./ui/spinner";
import { Pagination } from './common/Pagination';
import { StandardPagination } from '../types';
import { supabaseApiService } from '../services/supabaseApiService';

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

  // 페이지네이션 state
  const [loginPagination, setLoginPagination] = useState<StandardPagination>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20,
    has_next: false,
    has_prev: false
  });

  const [activityPagination, setActivityPagination] = useState<StandardPagination>({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    per_page: 20,
    has_next: false,
    has_prev: false
  });
  
  // 통계 데이터
  const [stats, setStats] = useState({
    totalLogins: 0,
    successfulLogins: 0,
    failedLogins: 0,
    uniqueUsers: 0,
    todayLogins: 0,
    suspiciousActivities: 0
  });

  // 데이터 로드 함수들
  const fetchLoginRecords = async (page: number = loginPagination.current_page) => {
    try {
      const response = await supabaseApiService.securityLogs.getLoginRecords({
        ...getFilterParams(),
        page,
        limit: loginPagination.per_page
      });

      setLoginRecords(response.data || []);

      // 페이지네이션 정보 업데이트
      if (response.total !== undefined) {
        const totalPages = Math.ceil(response.total / loginPagination.per_page);
        setLoginPagination({
          current_page: page,
          total_pages: totalPages,
          total_count: response.total,
          per_page: loginPagination.per_page,
          has_next: page < totalPages,
          has_prev: page > 1
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
        limit: activityPagination.per_page
      });

      setActivityLogs(response.data || []);

      // 페이지네이션 정보 업데이트
      if (response.total !== undefined) {
        const totalPages = Math.ceil(response.total / activityPagination.per_page);
        setActivityPagination({
          current_page: page,
          total_pages: totalPages,
          total_count: response.total,
          per_page: activityPagination.per_page,
          has_next: page < totalPages,
          has_prev: page > 1
        });
      }
    } catch (error) {
      console.error('활동 로그 조회 실패:', error);
      setActivityLogs([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await supabaseApiService.securityLogs.getStats({
        ...getFilterParams()
      });

      const data = response.data;
      setStats({
        totalLogins: data.total_logins || 0,
        successfulLogins: data.successful_logins || 0,
        failedLogins: data.failed_logins || 0,
        uniqueUsers: data.unique_users || 0,
        todayLogins: data.total_logins || 0, // 임시로 전체 로그인 수 사용
        suspiciousActivities: data.failed_logins || 0 // 실패한 로그인을 의심스러운 활동으로 간주
      });
    } catch (error) {
      console.error('통계 조회 실패:', error);
      setStats({
        totalLogins: 0,
        successfulLogins: 0,
        failedLogins: 0,
        uniqueUsers: 0,
        todayLogins: 0,
        suspiciousActivities: 0
      });
    }
  };

  const getFilterParams = () => {
    const params: any = {};
    
    if (searchTerm) {
      params.search = searchTerm;
    }
    
    if (statusFilter !== 'all') {
      if (statusFilter === 'success') {
        params.action = 'login,logout';
      } else if (statusFilter === 'failed') {
        params.action = 'failed_login';
      }
    }
    
    const now = new Date();
    if (dateFilter === 'today') {
      const today = now.toISOString().split('T')[0];
      params.start_date = today;
      params.end_date = today;
      console.log('📅 오늘 날짜 필터:', { start_date: today, end_date: today });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      params.start_date = weekAgo.toISOString().split('T')[0];
      params.end_date = now.toISOString().split('T')[0];
    }
    
    return params;
  };

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        activeTab === 'login' ? fetchLoginRecords() : fetchActivityLogs()
      ]);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, searchTerm, statusFilter, dateFilter]);

  // 새로고침 핸들러
  const handleRefresh = () => {
    loadData();
  };

  const getStatusBadge = (record: LoginRecord) => {
    if (record.action === 'failed_login') {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        실패
      </Badge>;
    } else if (record.action === 'login') {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-600">
        <CheckCircle className="w-3 h-3" />
        로그인
      </Badge>;
    } else {
      return <Badge variant="secondary" className="flex items-center gap-1">
        <Clock className="w-3 h-3" />
        로그아웃
      </Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    const colors = {
      view: 'bg-blue-100 text-blue-800',
      create: 'bg-green-100 text-green-800', 
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      search: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <Badge className={colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {action}
      </Badge>
    );
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    }
    return `${minutes}분`;
  };

  // 페이지네이션 핸들러들
  const handleLoginPageChange = (page: number) => {
    fetchLoginRecords(page);
  };

  const handleLoginLimitChange = (limit: number) => {
    setLoginPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    // 새로운 limit으로 첫 번째 페이지부터 다시 로드
    fetchLoginRecords(1);
  };

  const handleActivityPageChange = (page: number) => {
    fetchActivityLogs(page);
  };

  const handleActivityLimitChange = (limit: number) => {
    setActivityPagination(prev => ({ ...prev, per_page: limit, current_page: 1 }));
    // 새로운 limit으로 첫 번째 페이지부터 다시 로드
    fetchActivityLogs(1);
  };

  // API에서 이미 필터링된 데이터를 받으므로 클라이언트 필터링은 최소화
  const filteredLoginRecords = loginRecords;
  const filteredActivityLogs = activityLogs;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">보안 로그 관리</h2>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Excel 내보내기
          </Button>
          <Button
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">전체 로그인</p>
                <p className="text-2xl font-bold">{stats.totalLogins}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">성공 로그인</p>
                <p className="text-2xl font-bold text-green-600">{stats.successfulLogins}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">실패 로그인</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedLogins}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">활성 사용자</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">오늘 로그인</p>
                <p className="text-2xl font-bold">{stats.todayLogins}</p>
              </div>
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">의심 활동</p>
                <p className="text-2xl font-bold text-orange-600">{stats.suspiciousActivities}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          onClick={() => setActiveTab('login')}
          variant={activeTab === 'login' ? 'default' : 'ghost'}
          size="sm"
          className={activeTab === 'login' ? 'shadow-sm' : ''}
        >
          <Shield className="w-4 h-4 mr-2" />
          로그인 기록
        </Button>
        <Button
          onClick={() => setActiveTab('activity')}
          variant={activeTab === 'activity' ? 'default' : 'ghost'}
          size="sm"
          className={activeTab === 'activity' ? 'shadow-sm' : ''}
        >
          <Eye className="w-4 h-4 mr-2" />
          활동 로그
        </Button>
      </div>

      {/* 필터 및 검색 */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={activeTab === 'login' ? "사용자명 또는 IP 주소" : "사용자명 또는 대상"}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {activeTab === 'login' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">상태</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="success">성공</SelectItem>
                    <SelectItem value="failed">실패</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">기간</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">오늘</SelectItem>
                  <SelectItem value="week">최근 7일</SelectItem>
                  <SelectItem value="all">전체</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                필터 적용
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 로그인 기록 테이블 */}
      {activeTab === 'login' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              로그인 기록 ({filteredLoginRecords.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="default" />
                <span className="ml-2 text-muted-foreground">데이터를 불러오는 중...</span>
              </div>
            ) : filteredLoginRecords.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">로그인 기록이 없습니다</p>
                <p className="text-sm text-muted-foreground">필터 조건을 변경하거나 다른 기간을 선택해보세요</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>번호</TableHead>
                        <TableHead>시간</TableHead>
                        <TableHead>사용자</TableHead>
                        <TableHead>상태</TableHead>
                        <TableHead>IP 주소</TableHead>
                        <TableHead>위치</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoginRecords.map((record, index) => (
                        <TableRow key={record.id} className="hover:bg-muted/50">
                          <TableCell>{(loginPagination.current_page - 1) * loginPagination.per_page + index + 1}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {new Date(record.timestamp).toLocaleDateString('ko-KR')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(record.timestamp).toLocaleTimeString('ko-KR')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{record.user_name || '알 수 없음'}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(record)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4 text-muted-foreground" />
                              {record.ip_address}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              {record.location || '-'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredLoginRecords.length > 0 && (
                  <div className="mt-6">
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
            )}
          </CardContent>
        </Card>
      )}

      {/* 활동 로그 테이블 */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              활동 로그 ({filteredActivityLogs.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="default" />
                <span className="ml-2 text-muted-foreground">데이터를 불러오는 중...</span>
              </div>
            ) : filteredActivityLogs.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">활동 로그가 없습니다</p>
                <p className="text-sm text-muted-foreground">사용자 활동이 기록되면 여기에 표시됩니다</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>번호</TableHead>
                        <TableHead>시간</TableHead>
                        <TableHead>사용자</TableHead>
                        <TableHead>액션</TableHead>
                        <TableHead>리소스</TableHead>
                        <TableHead>대상</TableHead>
                        <TableHead>페이지</TableHead>
                        <TableHead>민감정보</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActivityLogs.map((log, index) => (
                        <TableRow key={log.id} className="hover:bg-muted/50">
                          <TableCell>{(activityPagination.current_page - 1) * activityPagination.per_page + index + 1}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">
                                {new Date(log.timestamp).toLocaleDateString('ko-KR')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{log.user_name || '알 수 없음'}</span>
                          </TableCell>
                          <TableCell>{getActionBadge(log.action)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.resource}</Badge>
                          </TableCell>
                          <TableCell>{log.details?.target_name || '-'}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{log.details?.page_name || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              {log.details?.sensitive_data_count || 0}개
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredActivityLogs.length > 0 && (
                  <div className="mt-6">
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
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default SecurityLogs;