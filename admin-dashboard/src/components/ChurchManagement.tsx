import React, { useState, useEffect, useMemo } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import {
  Button,
  Input,
  Card,
  LoadingState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  PageContainer,
  toast,
  Label,
} from "./ui";
import {
  Search,
  Users,
  CheckCircle,
  Church,
  Eye,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Edit,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { usePageSubtitle, usePageActions } from '../hooks/usePageSubtitle';
import * as XLSX from 'xlsx';

interface ChurchItem {
  id: string;
  serial_id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  pastor_name?: string;
  established_date?: string;
  denomination?: string;
  homepage_url?: string;
  youtube_channel?: string;
  subscription_status: string;
  subscription_end_date?: string;
  subscription_plan?: string;
  member_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

const STATUS_CHIP_CLASS: Record<string, string> = {
  active: 'bg-[#E7F6EC] text-[#16A34A]',
  inactive: 'bg-[#F1F4F9] text-[#64748B]',
  trial: 'bg-[#EAF1FE] text-[#2563EB]',
  suspended: 'bg-[#FCEBEB] text-[#DC2626]',
};

const STATUS_LABEL: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  trial: '체험',
  suspended: '정지',
};

const ChurchManagement: React.FC = () => {
  const [churches, setChurches] = useState<ChurchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedChurch, setSelectedChurch] = useState<ChurchItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [memberCounts, setMemberCounts] = useState<{ [key: number]: number }>({});
  const [lastLoginByChurch, setLastLoginByChurch] = useState<{ [key: number]: string | null }>({});
  const [sortField, setSortField] = useState<'id' | 'name' | 'pastor_name' | 'created_at' | 'member_count' | 'last_login'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [editData, setEditData] = useState({
    subscription_status: '',
    subscription_plan: '',
    subscription_end_date: '',
    member_limit: 100,
    is_active: true,
    homepage_url: '',
    youtube_channel: '',
  });

  useEffect(() => {
    fetchChurches();
  }, []);

  const fetchChurches = async () => {
    try {
      setLoading(true);
      const { data } = await supabaseApiService.churches.getAllWithSubscription();
      setChurches(data || []);

      if (data) {
        const countPromises = data.map(async (church) => {
          try {
            const churchId = parseInt(church.id);
            if (churchId) {
              // 실제 등록 교인 수: 이전(transferred) 처리된 교인 제외
              const { count, error } = await supabaseApiService.supabase
                .from('members')
                .select('*', { count: 'exact', head: true })
                .eq('church_id', churchId)
                .or('member_status.is.null,member_status.neq.transferred');

              if (error) {
                console.warn(`교회 ${church.name} (ID: ${churchId}) 교인 수 조회 오류:`, error);
                return { churchId, count: 0 };
              }
              return { churchId, count: count || 0 };
            }
            return { churchId: parseInt(church.id) || 0, count: 0 };
          } catch (error) {
            const churchId = parseInt(church.id);
            return { churchId: churchId || 0, count: 0 };
          }
        });

        const results = await Promise.all(countPromises);
        const counts: { [key: number]: number } = {};
        results.forEach(({ churchId, count }) => {
          counts[churchId] = count;
        });
        setMemberCounts(counts);

        // 교회별 관리자(super_admin / church_admin) 최근 로그인 시각 조회
        await fetchLastLoginByChurch(data);
      }
    } catch (error) {
      console.error('교회 목록 조회 실패:', error);
      toast({ title: '오류', description: '교회 목록을 불러오지 못했습니다.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLastLoginByChurch = async (churchList: ChurchItem[]) => {
    try {
      // 1) 관리자 사용자 목록 가져오기
      const churchIds = churchList
        .map(c => parseInt(c.id))
        .filter(id => !isNaN(id));

      if (churchIds.length === 0) {
        setLastLoginByChurch({});
        return;
      }

      const { data: admins, error: adminError } = await supabaseApiService.supabase
        .from('users')
        .select('id, church_id, role')
        .in('church_id', churchIds)
        .in('role', ['super_admin', 'church_super_admin', 'church_admin']);

      if (adminError || !admins) {
        console.warn('관리자 목록 조회 실패:', adminError);
        setLastLoginByChurch({});
        return;
      }

      const adminIds = admins.map(a => a.id);
      const adminToChurch: { [adminId: string]: number } = {};
      admins.forEach(a => { adminToChurch[a.id] = a.church_id; });

      if (adminIds.length === 0) {
        setLastLoginByChurch({});
        return;
      }

      // 2) 해당 관리자들의 성공 로그인 기록 가져오기 (최근부터)
      const { data: logs, error: logError } = await supabaseApiService.supabase
        .from('security_logs')
        .select('user_id, timestamp')
        .in('user_id', adminIds)
        .eq('action', 'login')
        .eq('success', true)
        .order('timestamp', { ascending: false })
        .limit(2000);

      if (logError || !logs) {
        console.warn('보안 로그 조회 실패:', logError);
        setLastLoginByChurch({});
        return;
      }

      // 3) 교회별 최신 로그인 시각으로 집계
      const lastLogins: { [key: number]: string | null } = {};
      for (const log of logs) {
        const churchId = adminToChurch[log.user_id];
        if (!churchId) continue;
        if (!lastLogins[churchId]) {
          lastLogins[churchId] = log.timestamp;
        }
      }
      setLastLoginByChurch(lastLogins);
    } catch (error) {
      console.warn('교회별 최근 접속일 조회 실패:', error);
      setLastLoginByChurch({});
    }
  };

  const handleEditChurch = (church: ChurchItem) => {
    setSelectedChurch(church);
    setEditData({
      subscription_status: church.subscription_status || '',
      subscription_plan: church.subscription_plan || '',
      subscription_end_date: church.subscription_end_date ? church.subscription_end_date.split('T')[0] : '',
      member_limit: church.member_limit || 100,
      is_active: church.is_active,
      homepage_url: church.homepage_url || '',
      youtube_channel: church.youtube_channel || '',
    });
    setShowEditModal(true);
  };

  const handleViewDetails = (church: ChurchItem) => {
    setSelectedChurch(church);
    setShowDetailModal(true);
  };

  const handleSaveChurch = async () => {
    if (!selectedChurch) return;

    setEditLoading(true);
    try {
      const updateData = {
        ...editData,
        subscription_end_date: editData.subscription_end_date || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseApiService.supabase
        .from('churches')
        .update(updateData)
        .eq('serial_id', selectedChurch.serial_id);

      if (error) throw error;

      toast({ title: '저장 완료', description: '교회 정보가 업데이트되었습니다.' });
      setShowEditModal(false);
      fetchChurches();
    } catch (error: any) {
      console.error('교회 정보 업데이트 실패:', error);
      toast({ title: '저장 실패', description: error.message || '업데이트에 실패했습니다.', variant: 'destructive' });
    } finally {
      setEditLoading(false);
    }
  };

  const getMemberLimitInfo = (church: ChurchItem) => {
    const currentCount = memberCounts[church.serial_id] || 0;
    const limit = church.member_limit || 100;
    const isUnlimited = church.member_limit === -1 ||
      (church.subscription_plan && church.subscription_plan !== 'trial' && church.subscription_status === 'active');

    if (isUnlimited) {
      return `${currentCount}명 (무제한)`;
    }
    const percentage = limit > 0 ? Math.round((currentCount / limit) * 100) : 0;
    return `${currentCount}/${limit}명 (${percentage}%)`;
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: typeof sortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-40" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 inline h-3 w-3" />
      : <ArrowDown className="ml-1 inline h-3 w-3" />;
  };

  const filteredChurches = useMemo(() => {
    return churches
      .filter(church => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = !search ||
          church.name.toLowerCase().includes(search) ||
          (church.pastor_name || '').toLowerCase().includes(search) ||
          (church.email || '').toLowerCase().includes(search);

        const matchesStatus = statusFilter === 'all' || church.subscription_status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortField) {
          case 'id':
            aValue = parseInt(a.id);
            bValue = parseInt(b.id);
            break;
          case 'name':
            aValue = a.name;
            bValue = b.name;
            break;
          case 'pastor_name':
            aValue = a.pastor_name || '';
            bValue = b.pastor_name || '';
            break;
          case 'created_at':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          case 'member_count':
            aValue = memberCounts[parseInt(a.id)] || 0;
            bValue = memberCounts[parseInt(b.id)] || 0;
            break;
          case 'last_login': {
            const aLogin = lastLoginByChurch[parseInt(a.id)];
            const bLogin = lastLoginByChurch[parseInt(b.id)];
            aValue = aLogin ? new Date(aLogin).getTime() : 0;
            bValue = bLogin ? new Date(bLogin).getTime() : 0;
            break;
          }
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [churches, searchTerm, statusFilter, sortField, sortDirection, memberCounts, lastLoginByChurch]);

  const handleExcelDownload = () => {
    try {
      const excelData = filteredChurches.map((church) => ({
        'ID': church.id,
        '교회명': church.name,
        '담임목사': church.pastor_name || '미설정',
        '교단': church.denomination || '미설정',
        '전화번호': church.phone || '미설정',
        '이메일': church.email || '미설정',
        '주소': church.address || '미설정',
        '교인 수': memberCounts[parseInt(church.id)] || 0,
        '구독 상태': STATUS_LABEL[church.subscription_status] || church.subscription_status,
        '교인 제한': getMemberLimitInfo(church),
        '활성 상태': church.is_active ? '활성' : '비활성',
        '최근 접속': lastLoginByChurch[parseInt(church.id)] ? formatDateTime(lastLoginByChurch[parseInt(church.id)]!) : '기록 없음',
        '등록일': formatDate(church.created_at),
        '수정일': church.updated_at ? formatDate(church.updated_at) : '없음',
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      worksheet['!cols'] = [
        { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 25 }, { wch: 40 }, { wch: 10 }, { wch: 10 },
        { wch: 15 }, { wch: 10 }, { wch: 18 }, { wch: 12 }, { wch: 12 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '교회 목록');
      const fileName = `교회목록_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({ title: '다운로드 완료', description: `${filteredChurches.length}개 교회를 내보냈습니다.` });
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      toast({ title: '다운로드 실패', description: '엑셀 파일을 생성하지 못했습니다.', variant: 'destructive' });
    }
  };

  // 통계
  const stats = useMemo(() => {
    const total = churches.length;
    const active = churches.filter(c => c.is_active).length;
    const totalMembers = Object.values(memberCounts).reduce((sum, c) => sum + c, 0);
    return { total, active, totalMembers };
  }, [churches, memberCounts]);

  // 상단바
  usePageSubtitle(`전체 ${stats.total}개 · 활성 ${stats.active}개`);
  usePageActions(
    <div className="flex gap-2">
      <Button onClick={handleExcelDownload} variant="outline" size="sm" className="gap-2">
        <Download className="h-3.5 w-3.5" />
        엑셀 다운로드
      </Button>
      <Button onClick={fetchChurches} variant="outline" size="sm" className="gap-2">
        <RefreshCw className="h-3.5 w-3.5" />
        새로고침
      </Button>
    </div>,
    [stats.total, filteredChurches.length]
  );

  const renderStatusChip = (status: string) => (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
      STATUS_CHIP_CLASS[status] || 'bg-[#F1F4F9] text-[#64748B]'
    )}>
      {STATUS_LABEL[status] || status}
    </span>
  );

  return (
    <PageContainer>
      {/* KPI strip */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#EAF1FE] text-[#2563EB]">
              <Church className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground">전체 교회</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-foreground">
                {stats.total}
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
              <div className="text-[12px] font-semibold text-muted-foreground">활성 교회</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-[#16A34A]">
                {stats.active}
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3 px-4 py-[14px]">
            <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FBF1E3] text-[#B45309]">
              <Users className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-[12px] font-semibold text-muted-foreground">전체 교인</div>
              <div className="text-[20px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-foreground">
                {stats.totalMembers.toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        {/* 검색 + 필터 바 */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF1F6] px-[16px] py-[14px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <Input
              type="text"
              placeholder="교회명·담임목사·이메일 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 md:w-[320px]"
            />
          </div>
          <div className="flex-1" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-[38px] w-auto min-w-[140px] gap-2">
              <span className="text-[12.5px] text-muted-foreground">상태</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="trial">체험</SelectItem>
              <SelectItem value="inactive">비활성</SelectItem>
              <SelectItem value="suspended">정지</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 테이블 */}
        {loading ? (
          <LoadingState text="교회 목록을 불러오는 중..." />
        ) : filteredChurches.length === 0 ? (
          <div className="py-12 text-center">
            <Church className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
            <h3 className="mb-2 text-[15px] font-bold text-foreground">
              {searchTerm || statusFilter !== 'all' ? '조건에 맞는 교회가 없습니다' : '등록된 교회가 없습니다'}
            </h3>
            <p className="text-[13px] text-muted-foreground">
              {searchTerm || statusFilter !== 'all' ? '검색어나 필터를 조정해보세요.' : '아직 등록된 교회가 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col className="w-[70px]" />
                <col />
                <col className="w-[130px]" />
                <col className="w-[100px]" />
                <col className="w-[90px]" />
                <col className="w-[150px]" />
                <col className="w-[120px]" />
                <col className="w-[100px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EEF1F6] bg-[#F8FAFD]">
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] hover:text-foreground"
                    onClick={() => handleSort('id')}
                  >
                    ID{getSortIcon('id')}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] hover:text-foreground"
                    onClick={() => handleSort('name')}
                  >
                    교회명{getSortIcon('name')}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] hover:text-foreground"
                    onClick={() => handleSort('pastor_name')}
                  >
                    담임목사{getSortIcon('pastor_name')}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] hover:text-foreground"
                    onClick={() => handleSort('member_count')}
                  >
                    교인 수{getSortIcon('member_count')}
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">상태</th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] hover:text-foreground"
                    onClick={() => handleSort('last_login')}
                  >
                    최근 접속{getSortIcon('last_login')}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8] hover:text-foreground"
                    onClick={() => handleSort('created_at')}
                  >
                    등록일{getSortIcon('created_at')}
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {filteredChurches.map((church) => (
                  <tr
                    key={church.id}
                    onClick={() => handleViewDetails(church)}
                    className="cursor-pointer transition-colors hover:bg-[#F8FAFD]"
                  >
                    <td className="px-4 py-3 text-[13px] text-muted-foreground tabular-nums">{church.id}</td>
                    <td className="truncate px-4 py-3 text-[13px] font-semibold text-foreground" title={church.name}>
                      {church.name}
                    </td>
                    <td className="truncate px-4 py-3 text-[13px] text-foreground">
                      {church.pastor_name || <span className="text-[#CBD5E1]">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] text-foreground tabular-nums">
                      {(memberCounts[parseInt(church.id)] || 0).toLocaleString()}명
                    </td>
                    <td className="px-4 py-3">{renderStatusChip(church.subscription_status)}</td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                      {lastLoginByChurch[parseInt(church.id)]
                        ? formatDateTime(lastLoginByChurch[parseInt(church.id)]!)
                        : <span className="text-[#CBD5E1]">기록 없음</span>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-foreground tabular-nums">
                      {formatDate(church.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(church)}
                          className="h-8 w-8 p-0"
                          title="상세보기"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditChurch(church)}
                          className="h-8 w-8 p-0"
                          title="편집"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 편집 모달 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>구독 설정 - {selectedChurch?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">구독 상태</Label>
                <Select value={editData.subscription_status} onValueChange={(value) => setEditData({ ...editData, subscription_status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                    <SelectItem value="trial">체험</SelectItem>
                    <SelectItem value="suspended">정지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">구독 만료일</Label>
                <Input
                  type="date"
                  value={editData.subscription_end_date}
                  onChange={(e) => setEditData({ ...editData, subscription_end_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">교인 제한 수</Label>
                <Input
                  type="number"
                  value={editData.member_limit}
                  onChange={(e) => setEditData({ ...editData, member_limit: parseInt(e.target.value) || 100 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">교회 홈페이지</Label>
                <Input
                  type="url"
                  value={editData.homepage_url}
                  onChange={(e) => setEditData({ ...editData, homepage_url: e.target.value })}
                  placeholder="https://church.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12.5px] font-semibold">유튜브 채널</Label>
                <Input
                  type="url"
                  value={editData.youtube_channel}
                  onChange={(e) => setEditData({ ...editData, youtube_channel: e.target.value })}
                  placeholder="https://youtube.com/@channel"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-[8px] border border-[#EEF1F6] bg-[#F8FAFD] px-3 py-2.5">
              <input
                type="checkbox"
                id="is_active"
                checked={editData.is_active}
                onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <Label htmlFor="is_active" className="cursor-pointer text-[13px] font-medium">
                교회 활성화
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditModal(false)}>
              취소
            </Button>
            <Button onClick={handleSaveChurch} disabled={editLoading}>
              {editLoading ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 상세보기 모달 */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="sm:max-w-[760px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>교회 상세 정보</DialogTitle>
          </DialogHeader>

          {selectedChurch && (
            <div className="space-y-5 py-2">
              {/* 상태·교회명 */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[#F8FAFD] px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-foreground">{selectedChurch.name}</span>
                  <span className="text-[11.5px] text-muted-foreground tabular-nums">ID {selectedChurch.id}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {renderStatusChip(selectedChurch.subscription_status)}
                  {selectedChurch.is_active ? (
                    <span className="inline-flex items-center rounded-full bg-[#E7F6EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#16A34A]">
                      활성
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-[#FCEBEB] px-2.5 py-0.5 text-[11px] font-semibold text-[#DC2626]">
                      비활성
                    </span>
                  )}
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">기본 정보</div>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-[13px] md:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">담임목사</dt>
                    <dd className="text-foreground">{selectedChurch.pastor_name || <span className="text-[#CBD5E1]">미설정</span>}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">교단</dt>
                    <dd className="text-foreground">{selectedChurch.denomination || <span className="text-[#CBD5E1]">미설정</span>}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">전화번호</dt>
                    <dd className="text-foreground tabular-nums">{selectedChurch.phone || <span className="text-[#CBD5E1]">미설정</span>}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">이메일</dt>
                    <dd className="truncate text-foreground">{selectedChurch.email || <span className="text-[#CBD5E1]">미설정</span>}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">설립일</dt>
                    <dd className="text-foreground tabular-nums">
                      {selectedChurch.established_date ? formatDate(selectedChurch.established_date) : <span className="text-[#CBD5E1]">미설정</span>}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">교인 수</dt>
                    <dd className="text-foreground tabular-nums">{getMemberLimitInfo(selectedChurch)}</dd>
                  </div>
                  {selectedChurch.address && (
                    <div className="flex gap-2 md:col-span-2">
                      <dt className="w-[90px] flex-shrink-0 text-muted-foreground">주소</dt>
                      <dd className="text-foreground">{selectedChurch.address}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* 채널 */}
              {(selectedChurch.homepage_url || selectedChurch.youtube_channel) && (
                <div className="space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">채널</div>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-[13px] md:grid-cols-2">
                    {selectedChurch.homepage_url && (
                      <div className="flex gap-2 md:col-span-2">
                        <dt className="w-[90px] flex-shrink-0 text-muted-foreground">홈페이지</dt>
                        <dd>
                          <a
                            href={selectedChurch.homepage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                          >
                            <span className="truncate">{selectedChurch.homepage_url}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </dd>
                      </div>
                    )}
                    {selectedChurch.youtube_channel && (
                      <div className="flex gap-2 md:col-span-2">
                        <dt className="w-[90px] flex-shrink-0 text-muted-foreground">유튜브</dt>
                        <dd>
                          <a
                            href={selectedChurch.youtube_channel}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                          >
                            <span className="truncate">{selectedChurch.youtube_channel}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* 구독 정보 */}
              <div className="space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">구독 정보</div>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-[13px] md:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">구독 상태</dt>
                    <dd>{renderStatusChip(selectedChurch.subscription_status)}</dd>
                  </div>
                  {selectedChurch.subscription_end_date && (
                    <div className="flex gap-2 md:col-span-2">
                      <dt className="w-[90px] flex-shrink-0 text-muted-foreground">만료일</dt>
                      <dd className={cn(
                        "tabular-nums",
                        new Date(selectedChurch.subscription_end_date) < new Date()
                          ? "font-semibold text-[#DC2626]"
                          : "text-foreground"
                      )}>
                        {formatDate(selectedChurch.subscription_end_date)}
                        {new Date(selectedChurch.subscription_end_date) < new Date() && (
                          <span className="ml-2 text-[11.5px]">(만료됨)</span>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* 등록·수정일 */}
              <div className="space-y-3 border-t border-[#EEF1F6] pt-4">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-[13px] md:grid-cols-2">
                  <div className="flex gap-2 md:col-span-2">
                    <dt className="w-[90px] flex-shrink-0 text-muted-foreground">최근 접속</dt>
                    <dd className="text-foreground tabular-nums">
                      {lastLoginByChurch[parseInt(selectedChurch.id)]
                        ? formatDateTime(lastLoginByChurch[parseInt(selectedChurch.id)]!)
                        : <span className="text-[#CBD5E1]">기록 없음</span>}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">등록일</dt>
                    <dd className="text-foreground tabular-nums">{formatDateTime(selectedChurch.created_at)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[90px] text-muted-foreground">수정일</dt>
                    <dd className="text-foreground tabular-nums">
                      {selectedChurch.updated_at ? formatDateTime(selectedChurch.updated_at) : <span className="text-[#CBD5E1]">없음</span>}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDetailModal(false)}>닫기</Button>
            <Button
              onClick={() => {
                setShowDetailModal(false);
                if (selectedChurch) handleEditChurch(selectedChurch);
              }}
              className="gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" />
              편집
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default ChurchManagement;
