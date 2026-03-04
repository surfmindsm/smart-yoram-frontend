import React, { useState, useEffect } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import {
  Calendar,
  DollarSign,
  User,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  X,
  CalendarDays,
  Users,
  ChevronDown,
  Check
} from 'lucide-react';
import { Button } from './ui';
import { Input } from './ui';
import { Card, CardContent } from './ui';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { DateRangePicker } from './ui';
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from '../lib/utils';
import { Spinner } from './ui/spinner';
import { PageContainer, PageHeader } from './ui';
import { Pagination } from './common/Pagination';

interface Offering {
  id: string;
  churchId: number;
  memberId: number;
  offeredOn: string;
  fundType: string;
  amount: number;
  note?: string;
  inputUserId: number;
  createdAt: string;
  updatedAt?: string;
  members?: {
    id: number;
    name?: string;
    full_name?: string;
    email?: string;
  };
  input_user?: {
    id: number;
    username?: string;
    full_name?: string;
  };
}

interface OfferingStats {
  total: number;
  total_amount: number;
  income_count?: number;
  expense_count?: number;
  by_fund_type: {
    [key: string]: {
      count: number;
      amount: number;
    };
  };
  period: {
    from?: string;
    to?: string;
  };
}

const OfferingsManagement: React.FC = () => {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [stats, setStats] = useState<OfferingStats | null>(null);
  const [fundTypes, setFundTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fundTypeFilter, setFundTypeFilter] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<Offering | null>(null);

  // 헌금 유형 검색 상태
  const [fundTypeSearchCreate, setFundTypeSearchCreate] = useState('');
  const [fundTypeSearchEdit, setFundTypeSearchEdit] = useState('');
  const [showFundTypeDropdownCreate, setShowFundTypeDropdownCreate] = useState(false);
  const [showFundTypeDropdownEdit, setShowFundTypeDropdownEdit] = useState(false);

  // 새 헌금 폼 데이터
  const [newOffering, setNewOffering] = useState({
    memberId: '',
    offeredOn: new Date().toISOString().split('T')[0],
    fundType: '주일헌금', // 기본값
    amount: '',
    note: ''
  });

  // 편집 폼 데이터
  const [editOffering, setEditOffering] = useState({
    memberId: '',
    offeredOn: '',
    fundType: '',
    amount: '',
    note: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '날짜 없음';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '잘못된 날짜';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '날짜 없음';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '잘못된 날짜';
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadOfferings(),
        loadStats(),
        loadFundTypes()
      ]);
    };
    loadAllData();
  }, [dateRange]); // 클라이언트 측 필터링으로 변경

  const loadOfferings = async () => {
    try {
      setLoading(true);

      // 현재 사용자의 church_id 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998; // 기본값 9998

      const params: any = {
        church_id: userChurchId  // 현재 사용자의 교회 ID로 필터링
      };

      // 날짜 범위 필터
      if (dateRange?.from) params.date_from = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange?.to) params.date_to = format(dateRange.to, 'yyyy-MM-dd');

      const response = await supabaseApiService.offerings.getAll(params);

      console.log('💰 [헌금] API 응답 전체:', response);
      console.log('💰 [헌금] 응답 타입:', typeof response);
      console.log('💰 [헌금] 응답 키들:', response ? Object.keys(response) : 'null/undefined');

      let offeringsData = [];

      if (Array.isArray(response)) {
        offeringsData = response;
      } else if (response && Array.isArray(response.data)) {
        offeringsData = response.data;
      } else {
        console.warn('🚨 [헌금] 예상치 못한 응답 구조:', response);
        offeringsData = [];
      }

      console.log('💰 [헌금] 추출된 원본 데이터 개수:', offeringsData.length);
      console.log('💰 [헌금] 추출된 원본 데이터 첫 번째 항목:', offeringsData[0]);

      // 백엔드 응답 데이터를 프론트엔드 인터페이스에 맞게 변환
      const transformedOfferings: Offering[] = offeringsData.map((item: any) => ({
        id: item.id,
        churchId: item.church_id,
        memberId: item.member_id,
        offeredOn: item.offered_on,
        fundType: item.fund_type,
        amount: parseFloat(item.amount),
        note: item.note,
        inputUserId: item.input_user_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        members: item.members,
        input_user: item.input_user
      }));

      console.log('💰 [헌금] 변환된 데이터 개수:', transformedOfferings.length);
      console.log('💰 [헌금] 변환된 데이터 첫 번째 항목:', transformedOfferings[0]);

      setOfferings(transformedOfferings);
      console.log('✅ [헌금] 상태 업데이트 완료, 총', transformedOfferings.length, '개의 헌금 데이터 로드됨');
    } catch (error) {
      console.error('Failed to load offerings:', error);
      setOfferings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // 현재 사용자의 church_id 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998; // 기본값 9998

      const filters: any = { church_id: userChurchId };
      if (dateRange?.from) filters.date_from = format(dateRange.from, 'yyyy-MM-dd');
      if (dateRange?.to) filters.date_to = format(dateRange.to, 'yyyy-MM-dd');

      const statsData = await supabaseApiService.offerings.getStats(filters);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load offering stats:', error);
    }
  };

  const loadFundTypes = async () => {
    try {
      // 계정과목 API에서 수입 계정과목 전체 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998;

      const token = await supabaseAuthService.getToken();
      if (!token) {
        console.error('No auth token available');
        return;
      }

      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/accounting/admin/categories?type=income&church_id=${userChurchId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const categories = Array.isArray(data) ? data : (data?.data || []);

        // 1. "헌금" 상위 카테고리 찾기
        const offeringParent = categories.find(
          (cat: any) => cat.name === '헌금' && !cat.parent_id
        );

        if (!offeringParent) {
          console.warn('⚠️ "헌금" 상위 카테고리를 찾을 수 없습니다.');
          setFundTypes(['십일조', '주일헌금', '감사헌금', '특별헌금']); // 기본값
          return;
        }

        console.log('✅ 헌금 상위 카테고리 찾음:', offeringParent);

        // 2. "헌금" 하위 항목들만 필터링 (parent_id가 헌금 카테고리 ID인 항목들)
        const offeringChildren = categories.filter(
          (cat: any) => cat.parent_id === offeringParent.id && cat.is_offering === true
        );

        const fundTypeNames = offeringChildren.map((cat: any) => cat.name).sort();
        setFundTypes(fundTypeNames);
        console.log('✅ 헌금 과목 로드 완료:', fundTypeNames);
        console.log('📊 총', fundTypeNames.length, '개의 헌금 종류');
      } else {
        console.error('Failed to load offering categories');
        setFundTypes(['십일조', '주일헌금', '감사헌금', '특별헌금']); // 기본값
      }
    } catch (error) {
      console.error('Failed to load fund types:', error);
      setFundTypes(['십일조', '주일헌금', '감사헌금', '특별헌금']); // 기본값
    }
  };

  const handleCreateOffering = async () => {
    if (!newOffering.memberId || !newOffering.amount || !newOffering.fundType) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      // 현재 사용자의 church_id 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998; // 기본값 9998

      const offeringData = {
        church_id: userChurchId,
        member_id: parseInt(newOffering.memberId),
        offered_on: newOffering.offeredOn,
        fund_type: newOffering.fundType,
        amount: parseFloat(newOffering.amount),
        note: newOffering.note,
        input_user_id: 1 // TODO: 현재 사용자 ID로 변경
      };

      await supabaseApiService.offerings.create(offeringData);

      await loadOfferings();
      await loadStats();

      setShowCreateModal(false);
      setNewOffering({
        memberId: '',
        offeredOn: new Date().toISOString().split('T')[0],
        fundType: '주일헌금',
        amount: '',
        note: ''
      });

      alert('헌금이 등록되었습니다.');
    } catch (error) {
      console.error('Failed to create offering:', error);
      alert('헌금 등록에 실패했습니다.');
    }
  };

  const handleEditOffering = async () => {
    if (!selectedOffering || !editOffering.memberId || !editOffering.amount || !editOffering.fundType) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      const updateData = {
        member_id: parseInt(editOffering.memberId),
        offered_on: editOffering.offeredOn,
        fund_type: editOffering.fundType,
        amount: parseFloat(editOffering.amount),
        note: editOffering.note
      };

      await supabaseApiService.offerings.update(selectedOffering.id, updateData);

      await loadOfferings();
      await loadStats();

      setShowEditModal(false);
      setSelectedOffering(null);
      alert('헌금 정보가 수정되었습니다.');
    } catch (error) {
      console.error('Failed to update offering:', error);
      alert('헌금 정보 수정에 실패했습니다.');
    }
  };

  const handleDeleteOffering = async (offering: Offering) => {
    if (!window.confirm('정말로 이 헌금 기록을 삭제하시겠습니까?')) return;

    try {
      await supabaseApiService.offerings.delete(offering.id);

      await loadOfferings();
      await loadStats();

      alert('헌금 기록이 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to delete offering:', error);
      alert('헌금 기록 삭제에 실패했습니다.');
    }
  };

  const openEditModal = (offering: Offering) => {
    setSelectedOffering(offering);
    setEditOffering({
      memberId: offering.memberId.toString(),
      offeredOn: offering.offeredOn,
      fundType: offering.fundType,
      amount: offering.amount.toString(),
      note: offering.note || ''
    });
    setShowEditModal(true);
  };

  const filteredOfferings = offerings.filter(offering => {
    // 헌금 유형 필터링
    if (fundTypeFilter.length > 0 && !fundTypeFilter.includes(offering.fundType)) {
      return false;
    }

    // 검색어 필터링
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const memberName = offering.members?.name || offering.members?.full_name || '';
      const inputUserName = offering.input_user?.username || offering.input_user?.full_name || '';
      return (
        memberName.toLowerCase().includes(searchLower) ||
        offering.fundType.toLowerCase().includes(searchLower) ||
        offering.note?.toLowerCase().includes(searchLower) ||
        inputUserName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredOfferings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOfferings = filteredOfferings.slice(startIndex, endIndex);

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, fundTypeFilter]);

  const exportToCSV = () => {
    const headers = ['날짜', '헌금자', '헌금종류', '금액', '메모', '등록자', '등록일'];
    const csvData = filteredOfferings.map(offering => [
      offering.offeredOn,
      offering.members?.name || offering.members?.full_name || '',
      offering.fundType,
      offering.amount,
      offering.note || '',
      offering.input_user?.username || offering.input_user?.full_name || '',
      formatDateTime(offering.createdAt)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `헌금내역_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageContainer>
      <PageHeader
        title="헌금 관리"
        description="교회 헌금 내역을 관리하고 통계를 확인합니다."
      />

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 헌금액</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_amount)}</p>
                  <p className="text-xs text-gray-500 mt-1">{stats.total}건</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 수입 건수</p>
                  <p className="text-2xl font-bold text-primary-600">{stats.income_count || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">수입</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 지출 건수</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expense_count || 0}</p>
                  <p className="text-xs text-gray-500 mt-1">지출</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">헌금 유형</p>
                  <p className="text-2xl font-bold text-orange-600">{Object.keys(stats.by_fund_type).length}</p>
                  <p className="text-xs text-gray-500 mt-1">종류</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 헌금 유형별 통계 */}
      {stats && Object.keys(stats.by_fund_type).length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">헌금 유형별 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(stats.by_fund_type).map(([type, data]) => (
              <div key={type} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600">{type}</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(data.amount)}</p>
                <p className="text-xs text-gray-500">{data.count}건</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* 검색 Input */}
          <Input
            type="text"
            placeholder="헌금자, 헌금유형, 메모 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-[400px]"
          />

          {/* 전체보기 버튼 */}
          {searchTerm && (
            <Button
              onClick={() => setSearchTerm('')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              전체보기
            </Button>
          )}

          {/* 헌금 유형 필터 */}
          <Popover>
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer bg-white",
                fundTypeFilter.length > 0 && "border-blue-300 text-blue-700"
              )}
            >
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm">헌금 유형</span>
                  {fundTypeFilter.length === 0 && (
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </PopoverTrigger>
              {fundTypeFilter.length > 0 && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFundTypeFilter([]);
                  }}
                />
              )}
            </div>
            <PopoverContent className="w-[200px] p-3" align="start">
              <div className="space-y-2">
                {fundTypes.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`fund-${type}`}
                      checked={fundTypeFilter.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFundTypeFilter([...fundTypeFilter, type]);
                        } else {
                          setFundTypeFilter(fundTypeFilter.filter((v) => v !== type));
                        }
                      }}
                    />
                    <label
                      htmlFor={`fund-${type}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {type}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* 기간 선택 */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />

          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              onClick={exportToCSV}
              className="flex items-center gap-2"
              disabled={filteredOfferings.length === 0}
            >
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              새 헌금
            </Button>
          </div>
        </div>
      </div>

      {/* 헌금 목록 */}
      <div className="space-y-4">
        {loading ? (
          <Card className="border-muted">
            <CardContent className="text-center py-12">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-gray-600">헌금 목록을 불러오는 중...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredOfferings.length === 0 ? (
          <Card className="border-muted">
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">헌금 기록이 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-muted">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      헌금일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      헌금자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      헌금 유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      메모
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      등록일
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      작업
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentOfferings.map((offering) => (
                  <tr key={offering.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{formatDate(offering.offeredOn)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {offering.members?.name || offering.members?.full_name || `ID: ${offering.memberId}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {offering.fundType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(offering.amount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 max-w-xs truncate">
                        {offering.note || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {offering.input_user?.username || offering.input_user?.full_name || `ID: ${offering.inputUserId}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{formatDateTime(offering.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedOffering(offering);
                            setShowDetailModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="상세보기"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(offering)}
                          className="text-green-600 hover:text-green-900"
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOffering(offering)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* 페이지네이션 */}
        {!loading && filteredOfferings.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              전체 {filteredOfferings.length.toLocaleString()}건
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredOfferings.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
              itemsPerPageOptions={[10, 20, 50, 100]}
            />
          </div>
        )}
      </div>

      {/* 새 헌금 등록 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">새 헌금 등록</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  교인 ID *
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newOffering.memberId}
                  onChange={(e) => setNewOffering({ ...newOffering, memberId: e.target.value })}
                  placeholder="교인 ID를 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  헌금일 *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newOffering.offeredOn}
                  onChange={(e) => setNewOffering({ ...newOffering, offeredOn: e.target.value })}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  헌금 유형 *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFundTypeDropdownCreate(!showFundTypeDropdownCreate)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-left flex items-center justify-between bg-white"
                  >
                    <span className={newOffering.fundType ? 'text-gray-900' : 'text-gray-400'}>
                      {newOffering.fundType || '헌금 유형 선택'}
                    </span>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-gray-400 transition-transform",
                      showFundTypeDropdownCreate && "transform rotate-180"
                    )} />
                  </button>

                  {showFundTypeDropdownCreate && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            placeholder="헌금 유형 검색..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            value={fundTypeSearchCreate}
                            onChange={(e) => setFundTypeSearchCreate(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {fundTypes
                          .filter(type => type.toLowerCase().includes(fundTypeSearchCreate.toLowerCase()))
                          .map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setNewOffering({ ...newOffering, fundType: type });
                                setShowFundTypeDropdownCreate(false);
                                setFundTypeSearchCreate('');
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                            >
                              <span className="text-sm text-gray-900">{type}</span>
                              {newOffering.fundType === type && (
                                <Check className="h-4 w-4 text-primary-600" />
                              )}
                            </button>
                          ))
                        }
                        {fundTypes.filter(type => type.toLowerCase().includes(fundTypeSearchCreate.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            검색 결과가 없습니다
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  금액 *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newOffering.amount}
                  onChange={(e) => setNewOffering({ ...newOffering, amount: e.target.value })}
                  placeholder="헌금 금액을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newOffering.note}
                  onChange={(e) => setNewOffering({ ...newOffering, note: e.target.value })}
                  placeholder="추가 메모를 입력하세요"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleCreateOffering}
                className="flex-1"
              >
                등록
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 헌금 상세 모달 */}
      {showDetailModal && selectedOffering && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">헌금 상세 정보</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">헌금일</label>
                  <p className="text-gray-900">{formatDate(selectedOffering.offeredOn)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">금액</label>
                  <p className="text-gray-900 text-lg font-semibold">{formatCurrency(selectedOffering.amount)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">헌금자</label>
                  <p className="text-gray-900">
                    {selectedOffering.members?.name || selectedOffering.members?.full_name || `ID: ${selectedOffering.memberId}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">헌금 유형</label>
                  <p className="text-gray-900">{selectedOffering.fundType}</p>
                </div>
              </div>

              {selectedOffering.note && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">메모</label>
                  <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{selectedOffering.note}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">등록자</label>
                  <p className="text-gray-900">
                    {selectedOffering.input_user?.username || selectedOffering.input_user?.full_name || `ID: ${selectedOffering.inputUserId}`}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">등록일</label>
                  <p className="text-gray-900">{formatDateTime(selectedOffering.createdAt)}</p>
                </div>
              </div>

              {selectedOffering.updatedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">수정일</label>
                  <p className="text-gray-900">{formatDateTime(selectedOffering.updatedAt)}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowDetailModal(false);
                  openEditModal(selectedOffering);
                }}
                className="flex items-center bg-green-600 text-white hover:bg-green-700 border-green-600 hover:border-green-700"
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-2" />
                수정
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 헌금 수정 모달 */}
      {showEditModal && selectedOffering && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">헌금 정보 수정</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  교인 ID *
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editOffering.memberId}
                  onChange={(e) => setEditOffering({ ...editOffering, memberId: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  헌금일 *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editOffering.offeredOn}
                  onChange={(e) => setEditOffering({ ...editOffering, offeredOn: e.target.value })}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  헌금 유형 *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFundTypeDropdownEdit(!showFundTypeDropdownEdit)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-left flex items-center justify-between bg-white"
                  >
                    <span className={editOffering.fundType ? 'text-gray-900' : 'text-gray-400'}>
                      {editOffering.fundType || '헌금 유형 선택'}
                    </span>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-gray-400 transition-transform",
                      showFundTypeDropdownEdit && "transform rotate-180"
                    )} />
                  </button>

                  {showFundTypeDropdownEdit && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <input
                            type="text"
                            placeholder="헌금 유형 검색..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            value={fundTypeSearchEdit}
                            onChange={(e) => setFundTypeSearchEdit(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {fundTypes
                          .filter(type => type.toLowerCase().includes(fundTypeSearchEdit.toLowerCase()))
                          .map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setEditOffering({ ...editOffering, fundType: type });
                                setShowFundTypeDropdownEdit(false);
                                setFundTypeSearchEdit('');
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                            >
                              <span className="text-sm text-gray-900">{type}</span>
                              {editOffering.fundType === type && (
                                <Check className="h-4 w-4 text-primary-600" />
                              )}
                            </button>
                          ))
                        }
                        {fundTypes.filter(type => type.toLowerCase().includes(fundTypeSearchEdit.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            검색 결과가 없습니다
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  금액 *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editOffering.amount}
                  onChange={(e) => setEditOffering({ ...editOffering, amount: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={editOffering.note}
                  onChange={(e) => setEditOffering({ ...editOffering, note: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleEditOffering}
                className="flex-1 bg-green-600 text-white hover:bg-green-700 border-green-600 hover:border-green-700"
                variant="outline"
              >
                수정
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default OfferingsManagement;