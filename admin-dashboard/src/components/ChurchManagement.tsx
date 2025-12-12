import React, { useState, useEffect } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { Button } from "./ui";
import { Input } from "./ui";
import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { Badge } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Textarea } from "./ui";
import {
  Search,
  Edit,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Church,
  CreditCard,
  Settings,
  Eye,
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';

interface Church {
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

const ChurchManagement: React.FC = () => {
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionUpdateLoading, setSubscriptionUpdateLoading] = useState<Record<number, boolean>>({});
  const [planFilter, setPlanFilter] = useState('all');
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [memberCounts, setMemberCounts] = useState<{[key: number]: number}>({});
  const [sortField, setSortField] = useState<'id' | 'name' | 'pastor_name' | 'created_at' | 'member_count'>('id');
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
      console.log('🏛️ 교회 목록 조회 시작 (구독 정보 포함)');

      // 구독 정보를 포함한 교회 조회
      const { data } = await supabaseApiService.churches.getAllWithSubscription();

      console.log('✅ 교회 목록 조회 성공:', data?.length, '개');
      setChurches(data || []);

      // 각 교회의 교인 수 조회 (병렬 처리로 성능 개선)
      if (data) {
        const counts: {[key: number]: number} = {};

        // 모든 교회의 교인 수를 병렬로 조회
        const countPromises = data.map(async (church) => {
          try {
            const churchId = parseInt(church.id);
            if (churchId) {
              const { count, error } = await supabaseApiService.supabase
                .from('members')
                .select('*', { count: 'exact', head: true })
                .eq('church_id', churchId);

              if (error) {
                console.warn(`교회 ${church.name} (ID: ${churchId}) 교인 수 조회 오류:`, error);
                return { churchId, count: 0 };
              } else {
                console.log(`✅ 교회 ${church.name} (ID: ${churchId}) 교인 수: ${count}명`);
                return { churchId, count: count || 0 };
              }
            } else {
              console.warn(`교회 ${church.name}의 ID가 유효하지 않음:`, church.id);
              return { churchId: parseInt(church.id) || 0, count: 0 };
            }
          } catch (error) {
            console.warn(`교회 ${church.name} 교인 수 조회 실패:`, error);
            const churchId = parseInt(church.id);
            return { churchId: churchId || 0, count: 0 };
          }
        });

        // 모든 요청이 완료될 때까지 기다림
        const results = await Promise.all(countPromises);

        // 결과를 counts 객체로 변환
        results.forEach(({ churchId, count }) => {
          counts[churchId] = count;
        });

        setMemberCounts(counts);
      }
    } catch (error) {
      console.error('교회 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChurch = (church: Church) => {
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

  const handleViewDetails = (church: Church) => {
    setSelectedChurch(church);
    setShowDetailModal(true);
  };

  // 구독 상태 업데이트 및 member_limit 자동 적용
  const updateSubscription = async (churchId: number, plan: string, status: string) => {
    setSubscriptionUpdateLoading(prev => ({ ...prev, [churchId]: true }));
    try {
      await supabaseApiService.churches.updateSubscriptionAndLimit(churchId, plan, status);
      alert('구독 상태가 업데이트되고 교인 제한이 자동 적용되었습니다.');
      fetchChurches(); // 목록 새로고침
    } catch (error) {
      console.error('구독 업데이트 실패:', error);
      alert('구독 업데이트에 실패했습니다.');
    } finally {
      setSubscriptionUpdateLoading(prev => ({ ...prev, [churchId]: false }));
    }
  };

  // 전체 교회 정책 일괄 적용
  const applySubscriptionPolicy = async () => {
    if (!window.confirm('모든 교회에 구독 정책을 일괄 적용하시겠습니까?\n\n- trial/null → 500명 제한\n- active 유료 → 무제한')) return;

    setLoading(true);
    try {
      let updatedCount = 0;
      for (const church of churches) {
        try {
          await supabaseApiService.churches.updateSubscriptionAndLimit(
            church.serial_id,
            church.subscription_plan || 'trial',
            church.subscription_status || 'inactive'
          );
          updatedCount++;
        } catch (error) {
          console.warn(`교회 ${church.name} 업데이트 실패:`, error);
        }
      }
      alert(`${updatedCount}개 교회의 구독 정책이 적용되었습니다.`);
      fetchChurches();
    } catch (error) {
      console.error('일괄 업데이트 실패:', error);
      alert('일괄 업데이트에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChurch = async () => {
    if (!selectedChurch) return;

    setEditLoading(true);
    try {
      console.log('🔄 교회 정보 업데이트 시작:', selectedChurch.serial_id);

      const updateData = {
        ...editData,
        subscription_end_date: editData.subscription_end_date || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseApiService.supabase
        .from('churches')
        .update(updateData)
        .eq('serial_id', selectedChurch.serial_id);

      if (error) {
        console.error('교회 정보 업데이트 오류:', error);
        throw error;
      }

      console.log('✅ 교회 정보 업데이트 성공');
      alert('교회 정보가 성공적으로 업데이트되었습니다.');
      setShowEditModal(false);
      fetchChurches();
    } catch (error) {
      console.error('교회 정보 업데이트 실패:', error);
      alert('교회 정보 업데이트에 실패했습니다.');
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200">활성</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">비활성</Badge>;
      case 'trial':
        return <Badge className="bg-primary-100 text-primary-700 border-primary-200">체험</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-700 border-red-200">정지</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string | null | undefined) => {
    if (!plan || plan === 'trial') {
      return <Badge variant="outline" className="text-gray-600">무료</Badge>;
    }
    switch (plan) {
      case 'standard':
        return <Badge className="bg-primary-500 text-white">스탠다드</Badge>;
      case 'premium':
        return <Badge className="bg-purple-500 text-white">프리미엄</Badge>;
      case 'enterprise':
        return <Badge className="bg-gold-500 text-white">엔터프라이즈</Badge>;
      default:
        return <Badge variant="secondary">{plan}</Badge>;
    }
  };

  const getMemberLimitInfo = (church: Church) => {
    const currentCount = memberCounts[church.serial_id] || 0;
    const limit = church.member_limit || 100;
    const isUnlimited = church.member_limit === -1 ||
      (church.subscription_plan && church.subscription_plan !== 'trial' && church.subscription_status === 'active');

    if (isUnlimited) {
      return `${currentCount}명 (무제한)`;
    } else {
      const percentage = limit > 0 ? Math.round((currentCount / limit) * 100) : 0;
      return `${currentCount}/${limit}명 (${percentage}%)`;
    }
  };

  const handleSort = (field: 'id' | 'name' | 'pastor_name' | 'created_at' | 'member_count') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: 'id' | 'name' | 'pastor_name' | 'created_at' | 'member_count') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 inline opacity-40" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 ml-1 inline" />
      : <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  const handleExcelDownload = () => {
    try {
      // 엑셀로 내보낼 데이터 준비
      const excelData = filteredChurches.map((church) => ({
        'ID': church.id,
        '교회명': church.name,
        '담임목사': church.pastor_name || '미설정',
        '교단': church.denomination || '미설정',
        '전화번호': church.phone || '미설정',
        '이메일': church.email || '미설정',
        '주소': church.address || '미설정',
        '교인 수': memberCounts[parseInt(church.id)] || 0,
        '구독 상태': church.subscription_status === 'active' ? '활성' :
                    church.subscription_status === 'inactive' ? '비활성' :
                    church.subscription_status === 'trial' ? '체험' :
                    church.subscription_status === 'suspended' ? '정지' : church.subscription_status,
        '구독 플랜': !church.subscription_plan || church.subscription_plan === 'trial' ? '무료' :
                    church.subscription_plan === 'standard' ? '스탠다드' :
                    church.subscription_plan === 'premium' ? '프리미엄' :
                    church.subscription_plan === 'enterprise' ? '엔터프라이즈' : church.subscription_plan,
        '교인 제한': getMemberLimitInfo(church),
        '활성 상태': church.is_active ? '활성' : '비활성',
        '등록일': new Date(church.created_at).toLocaleDateString('ko-KR'),
        '수정일': church.updated_at ? new Date(church.updated_at).toLocaleDateString('ko-KR') : '없음',
      }));

      // 워크시트 생성
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 8 },  // ID
        { wch: 25 }, // 교회명
        { wch: 15 }, // 담임목사
        { wch: 15 }, // 교단
        { wch: 15 }, // 전화번호
        { wch: 25 }, // 이메일
        { wch: 40 }, // 주소
        { wch: 10 }, // 교인 수
        { wch: 10 }, // 구독 상태
        { wch: 12 }, // 구독 플랜
        { wch: 15 }, // 교인 제한
        { wch: 10 }, // 활성 상태
        { wch: 12 }, // 등록일
        { wch: 12 }, // 수정일
      ];
      worksheet['!cols'] = columnWidths;

      // 워크북 생성
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '교회 목록');

      // 파일명 생성 (현재 날짜 포함)
      const fileName = `교회목록_${new Date().toLocaleDateString('ko-KR').replace(/\. /g, '-').replace('.', '')}.xlsx`;

      // 엑셀 파일 다운로드
      XLSX.writeFile(workbook, fileName);

      console.log(`✅ 엑셀 다운로드 성공: ${filteredChurches.length}개 교회`);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  const filteredChurches = churches
    .filter(church => {
      const matchesSearch = !searchTerm ||
        church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        church.pastor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        church.email?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
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
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">교회 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">교회 관리</h2>
        <div className="flex gap-2">
          <Button onClick={handleExcelDownload} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            엑셀 다운로드
          </Button>
          <Button onClick={fetchChurches} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">{churches.length}</p>
                <p className="text-sm text-muted-foreground">전체 교회</p>
              </div>
              <Church className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {churches.filter(c => c.is_active).length}
                </p>
                <p className="text-sm text-muted-foreground">활성 교회</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 */}
      <Card>
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="교회명, 담임목사, 이메일 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 교회 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>교회 목록 ({filteredChurches.length}개)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b">
                  <th
                    className="text-left py-4 px-6 font-semibold cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('id')}
                  >
                    ID{getSortIcon('id')}
                  </th>
                  <th
                    className="text-left py-4 px-6 font-semibold cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('name')}
                  >
                    교회명{getSortIcon('name')}
                  </th>
                  <th
                    className="text-left py-4 px-6 font-semibold cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('pastor_name')}
                  >
                    담임목사{getSortIcon('pastor_name')}
                  </th>
                  <th
                    className="text-left py-4 px-6 font-semibold cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('member_count')}
                  >
                    교인 수{getSortIcon('member_count')}
                  </th>
                  <th
                    className="text-left py-4 px-6 font-semibold cursor-pointer hover:bg-muted/50 transition-colors whitespace-nowrap"
                    onClick={() => handleSort('created_at')}
                  >
                    등록일{getSortIcon('created_at')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredChurches.map((church) => (
                  <tr
                    key={church.id}
                    className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetails(church)}
                  >
                    <td className="py-4 px-6 text-muted-foreground whitespace-nowrap">
                      {church.id}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-medium text-base">{church.name}</span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground whitespace-nowrap">
                      {church.pastor_name || '미설정'}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="font-medium">{memberCounts[parseInt(church.id)] || 0}명</span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground whitespace-nowrap">
                      {new Date(church.created_at).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredChurches.length === 0 && (
              <div className="text-center py-12">
                <Church className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">조건에 맞는 교회가 없습니다.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 편집 모달 */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              교회 구독 설정 - {selectedChurch?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">구독 상태</label>
                <Select value={editData.subscription_status} onValueChange={(value) => setEditData({...editData, subscription_status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">활성</SelectItem>
                    <SelectItem value="inactive">비활성</SelectItem>
                    <SelectItem value="trial">체험</SelectItem>
                    <SelectItem value="suspended">정지</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">구독 플랜</label>
                <Select value={editData.subscription_plan} onValueChange={(value) => setEditData({...editData, subscription_plan: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">무료 체험</SelectItem>
                    <SelectItem value="standard">스탠다드</SelectItem>
                    <SelectItem value="premium">프리미엄</SelectItem>
                    <SelectItem value="enterprise">엔터프라이즈</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">구독 만료일</label>
                <Input
                  type="date"
                  value={editData.subscription_end_date}
                  onChange={(e) => setEditData({...editData, subscription_end_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">교인 제한 수</label>
                <Input
                  type="number"
                  value={editData.member_limit}
                  onChange={(e) => setEditData({...editData, member_limit: parseInt(e.target.value) || 100})}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  유료 플랜의 경우 실제로는 무제한이지만 표시용 숫자입니다.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">교회 홈페이지</label>
                <Input
                  type="url"
                  value={editData.homepage_url}
                  onChange={(e) => setEditData({...editData, homepage_url: e.target.value})}
                  placeholder="https://church.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">유튜브 채널</label>
                <Input
                  type="url"
                  value={editData.youtube_channel}
                  onChange={(e) => setEditData({...editData, youtube_channel: e.target.value})}
                  placeholder="https://youtube.com/@channel"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={editData.is_active}
                onChange={(e) => setEditData({...editData, is_active: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">
                교회 활성화
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Church className="w-5 h-5" />
              교회 상세 정보 - {selectedChurch?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedChurch && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">교회명</label>
                  <p className="text-foreground font-medium">{selectedChurch.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">담임목사</label>
                  <p className="text-foreground">{selectedChurch.pastor_name || '미설정'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">교단</label>
                  <p className="text-foreground">{selectedChurch.denomination || '미설정'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">설립일</label>
                  <p className="text-foreground">
                    {selectedChurch.established_date ? new Date(selectedChurch.established_date).toLocaleDateString('ko-KR') : '미설정'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">전화번호</label>
                  <p className="text-foreground">{selectedChurch.phone || '미설정'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">이메일</label>
                  <p className="text-foreground">{selectedChurch.email || '미설정'}</p>
                </div>
              </div>

              {selectedChurch.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">주소</label>
                  <p className="text-foreground">{selectedChurch.address}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">교회 홈페이지</label>
                  <p className="text-foreground">
                    {selectedChurch.homepage_url ? (
                      <a href={selectedChurch.homepage_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {selectedChurch.homepage_url}
                      </a>
                    ) : '미설정'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">유튜브 채널</label>
                  <p className="text-foreground">
                    {selectedChurch.youtube_channel ? (
                      <a href={selectedChurch.youtube_channel} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                        {selectedChurch.youtube_channel}
                      </a>
                    ) : '미설정'}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-foreground mb-3">구독 정보</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">구독 상태</label>
                    <div className="mt-1">{getStatusBadge(selectedChurch.subscription_status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">구독 플랜</label>
                    <div className="mt-1">{getPlanBadge(selectedChurch.subscription_plan)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">교인 수</label>
                    <p className="text-foreground font-medium">{getMemberLimitInfo(selectedChurch)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">교회 상태</label>
                    <div className="mt-1">
                      {selectedChurch.is_active ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">활성</Badge>
                      ) : (
                        <Badge variant="destructive">비활성</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {selectedChurch.subscription_end_date && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-muted-foreground">구독 만료일</label>
                    <p className={cn(
                      "font-medium",
                      new Date(selectedChurch.subscription_end_date) < new Date()
                        ? "text-red-600"
                        : "text-foreground"
                    )}>
                      {new Date(selectedChurch.subscription_end_date).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}
              </div>


              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">등록일:</span> {new Date(selectedChurch.created_at).toLocaleString('ko-KR')}
                  </div>
                  <div>
                    <span className="font-medium">수정일:</span> {selectedChurch.updated_at ? new Date(selectedChurch.updated_at).toLocaleString('ko-KR') : '없음'}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              닫기
            </Button>
            <Button onClick={() => {
              setShowDetailModal(false);
              if (selectedChurch) handleEditChurch(selectedChurch);
            }}>
              편집하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChurchManagement;