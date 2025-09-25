import React, { useState, useEffect } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { Button } from "@/components/ui3";
import { Input } from "@/components/ui3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui3";
import { Badge } from "@/components/ui3";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui3";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui3";
import { Textarea } from "@/components/ui3";
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
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';

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

  const [editData, setEditData] = useState({
    subscription_status: '',
    subscription_plan: '',
    subscription_end_date: '',
    member_limit: 100,
    is_active: true,
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

      // 각 교회의 교인 수 조회
      if (data) {
        const counts: {[key: number]: number} = {};
        for (const church of data) {
          try {
            // serial_id가 유효한 경우에만 교인 수 조회
            if (church.serial_id && typeof church.serial_id === 'number') {
              const { data: members } = await supabaseApiService.supabase
                .from('members')
                .select('id', { count: 'exact' })
                .eq('church_id', church.serial_id);
              counts[church.serial_id] = members?.length || 0;
            } else {
              console.warn(`교회 ${church.name}의 serial_id가 유효하지 않음:`, church.serial_id);
              counts[church.serial_id || 0] = 0;
            }
          } catch (error) {
            console.warn(`교회 ${church.serial_id} 교인 수 조회 실패:`, error);
            counts[church.serial_id || 0] = 0;
          }
        }
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
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">체험</Badge>;
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
        return <Badge className="bg-blue-500 text-white">스탠다드</Badge>;
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
    const isUnlimited = church.subscription_plan && church.subscription_plan !== 'trial' && church.subscription_status === 'active';

    if (isUnlimited) {
      return `${currentCount}명 (무제한)`;
    } else {
      const percentage = limit > 0 ? Math.round((currentCount / limit) * 100) : 0;
      return `${currentCount}/${limit}명 (${percentage}%)`;
    }
  };

  const filteredChurches = churches.filter(church => {
    const matchesSearch = !searchTerm ||
      church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.pastor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      church.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || church.subscription_status === statusFilter;
    const matchesPlan = planFilter === 'all' ||
      (planFilter === 'free' && (!church.subscription_plan || church.subscription_plan === 'trial')) ||
      (planFilter === 'paid' && church.subscription_plan && church.subscription_plan !== 'trial');

    return matchesSearch && matchesStatus && matchesPlan;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">교회 정보를 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">교회 관리</h2>
        <div className="flex gap-2">
          <Button
            onClick={applySubscriptionPolicy}
            variant="default"
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            구독 정책 일괄 적용
          </Button>
          <Button onClick={fetchChurches} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            새로고침
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <p className="text-2xl font-bold text-green-600">
                  {churches.filter(c => c.subscription_status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">활성 교회</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {churches.filter(c => c.subscription_plan && c.subscription_plan !== 'trial').length}
                </p>
                <p className="text-sm text-muted-foreground">유료 교회</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {churches.filter(c => !c.subscription_plan || c.subscription_plan === 'trial').length}
                </p>
                <p className="text-sm text-muted-foreground">무료 교회</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="교회명, 담임목사, 이메일 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">구독 상태</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                  <SelectItem value="trial">체험</SelectItem>
                  <SelectItem value="suspended">정지</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">요금제</label>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="free">무료</SelectItem>
                  <SelectItem value="paid">유료</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 교회 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>교회 목록 ({filteredChurches.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredChurches.map((church) => (
              <div key={church.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{church.name}</h3>
                      {getStatusBadge(church.subscription_status)}
                      {getPlanBadge(church.subscription_plan)}
                      {!church.is_active && (
                        <Badge variant="destructive" className="text-xs">비활성</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">담임목사:</span> {church.pastor_name || '미설정'}
                      </div>
                      <div>
                        <span className="font-medium">교인 수:</span> {getMemberLimitInfo(church)}
                      </div>
                      <div>
                        <span className="font-medium">이메일:</span> {church.email || '미설정'}
                      </div>
                      <div>
                        <span className="font-medium">등록일:</span> {new Date(church.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    {church.subscription_end_date && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium text-muted-foreground">구독 만료일:</span>{' '}
                        <span className={cn(
                          new Date(church.subscription_end_date) < new Date()
                            ? "text-red-600 font-medium"
                            : "text-foreground"
                        )}>
                          {new Date(church.subscription_end_date).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {/* 구독 상태 빠른 업데이트 버튼 */}
                    <div className="flex flex-col gap-1">
                      <Button
                        onClick={() => updateSubscription(church.serial_id, 'trial', 'inactive')}
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-auto"
                        disabled={subscriptionUpdateLoading[church.serial_id]}
                      >
                        {subscriptionUpdateLoading[church.serial_id] ? '처리중...' : '무료(500명)'}
                      </Button>
                      <Button
                        onClick={() => updateSubscription(church.serial_id, 'premium', 'active')}
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-auto"
                        disabled={subscriptionUpdateLoading[church.serial_id]}
                      >
                        {subscriptionUpdateLoading[church.serial_id] ? '처리중...' : '유료(무제한)'}
                      </Button>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        onClick={() => handleViewDetails(church)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        상세보기
                      </Button>
                      <Button
                        onClick={() => handleEditChurch(church)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        편집
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

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