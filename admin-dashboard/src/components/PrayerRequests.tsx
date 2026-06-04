import React, { useState, useEffect } from 'react';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Heart,
  MessageSquare,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Users,
  CheckCircle,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent, LoadingState } from "./ui";
import { Badge, Button, Combobox } from "./ui";
import { Spinner } from "./ui/spinner";
import { PageContainer, PageHeader } from "./ui";
import { SearchFilterBar } from './common';
import type { Filter as FilterType } from './common';
import { getPositionDetailLabel } from '../constants/memberPositions';

interface Member {
  id: number;
  church_id?: number;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  position_detail?: string;
  organization_name?: string;
  department?: string;
  profile_photo_url?: string;
}

interface PrayerRequest {
  id: string;
  churchId: number;
  memberId?: number;
  requesterName: string;
  requesterPhone?: string;
  organizationName?: string;
  department?: string;
  profilePhotoUrl?: string;
  prayerType: string;
  prayerContent: string;
  isAnonymous: boolean;
  isUrgent: boolean;
  isPublic: boolean;
  status: string;
  adminNotes?: string;
  answeredTestimony?: string;
  prayerCount: number;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  expiresAt?: string;
}

interface PrayerRequestStats {
  total: number;
  active: number;
  answered: number;
  closed: number;
  urgent: number;
  public: number;
  by_type: {
    general: number;
    healing: number;
    family: number;
    work: number;
    ministry: number;
  };
}

const PrayerRequests: React.FC = () => {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [stats, setStats] = useState<PrayerRequestStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [urgentFilter, setUrgentFilter] = useState('all');
  const [publicFilter, setPublicFilter] = useState('all');
  const [members, setMembers] = useState<Member[]>([]);

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);

  // 새 기도요청 폼 데이터
  const [newRequest, setNewRequest] = useState({
    memberId: '',
    requesterName: '',
    requesterPhone: '',
    organizationName: '',
    department: '',
    profilePhotoUrl: '',
    prayerType: 'general',
    prayerContent: '',
    isAnonymous: false,
    isUrgent: false,
    isPublic: true
  });

  const formatDate = (dateString: string) => {
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

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return '1일 전';
      if (diffDays < 7) return `${diffDays}일 전`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)}주 전`;
      return `${Math.ceil(diffDays / 30)}개월 전`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadPrayerRequests(),
        loadStats()
      ]);
    };
    loadAllData();
  }, [statusFilter, urgentFilter, publicFilter]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const currentUser = await supabaseAuthService.getCurrentUser();
        const userChurchId = currentUser?.user?.church_id || 9998;

        const response = await supabaseApiService.members.getAll({ church_id: userChurchId, limit: 500 });

        const membersData = response?.data || response || [];

        setMembers(membersData);
      } catch (error) {
        setMembers([]);
      }
    };

    loadMembers();
  }, []);

  const loadPrayerRequests = async () => {
    try {
      setLoading(true);

      // 현재 사용자의 church_id 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998; // 기본값 9998

      const params: any = {
        church_id: userChurchId  // 현재 사용자의 교회 ID로 필터링
      };

      // 필터는 클라이언트 사이드에서 처리
      if (urgentFilter !== 'all') params.is_urgent = urgentFilter === 'true';
      if (publicFilter !== 'all') params.is_public = publicFilter === 'true';

      const response = await supabaseApiService.prayerRequests.getAll(params);

      let prayerRequestsData = [];

      if (Array.isArray(response)) {
        prayerRequestsData = response;
      } else if (response && Array.isArray(response.data)) {
        prayerRequestsData = response.data;
      } else {
        prayerRequestsData = [];
      }

      // 백엔드 응답 데이터를 프론트엔드 인터페이스에 맞게 변환
      const transformedRequests: PrayerRequest[] = prayerRequestsData.map((item: any) => ({
        id: item.id,
        churchId: item.church_id,
        memberId: item.member_id,
        requesterName: item.requester_name,
        requesterPhone: item.requester_phone,
        organizationName: item.organization_name,
        department: item.department,
        profilePhotoUrl: item.profile_photo_url,
        prayerType: item.prayer_type,
        prayerContent: item.prayer_content,
        isAnonymous: item.is_anonymous || false,
        isUrgent: item.is_urgent || false,
        isPublic: item.is_public !== false, // 기본값 true
        status: item.status,
        adminNotes: item.admin_notes,
        answeredTestimony: item.answered_testimony,
        prayerCount: item.prayer_count || 0,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        closedAt: item.closed_at,
        expiresAt: item.expires_at
      }));

      setRequests(transformedRequests);
    } catch (error) {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await supabaseApiService.prayerRequests.getStats(6);
      setStats(statsData);
    } catch (error) {
      // Error loading stats
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.prayerContent) {
      alert('기도 내용을 입력해주세요.');
      return;
    }

    if (!newRequest.isAnonymous && !newRequest.requesterName) {
      alert('요청자 이름을 입력해주세요.');
      return;
    }

    try {
      // 현재 사용자의 church_id 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998; // 기본값 9998

      const requestData: any = {
        church_id: userChurchId,
        member_id: newRequest.memberId ? parseInt(newRequest.memberId) : null,
        requester_name: newRequest.isAnonymous ? '익명' : newRequest.requesterName,
        requester_phone: newRequest.isAnonymous ? '' : newRequest.requesterPhone,
        prayer_type: newRequest.prayerType,
        prayer_content: newRequest.prayerContent,
        is_anonymous: newRequest.isAnonymous,
        is_urgent: newRequest.isUrgent,
        is_public: newRequest.isPublic
      };

      // member_id를 저장하면 조회 시 members 테이블과 조인해서 organization, department, profile_photo_url을 가져옴

      await supabaseApiService.prayerRequests.create(requestData);

      await loadPrayerRequests();
      await loadStats();

      setShowCreateModal(false);
      setNewRequest({
        memberId: '',
        requesterName: '',
        requesterPhone: '',
        organizationName: '',
        department: '',
        profilePhotoUrl: '',
        prayerType: 'general',
        prayerContent: '',
        isAnonymous: false,
        isUrgent: false,
        isPublic: true
      });

      alert('기도요청이 등록되었습니다.');
    } catch (error) {
      alert('기도요청 등록에 실패했습니다.');
    }
  };

  const handleDeleteRequest = async (request: PrayerRequest) => {
    if (!window.confirm('정말로 이 기도요청을 삭제하시겠습니까?')) return;

    try {
      await supabaseApiService.prayerRequests.delete(request.id);

      await loadPrayerRequests();
      await loadStats();

      alert('기도요청이 삭제되었습니다.');
    } catch (error) {
      alert('기도요청 삭제에 실패했습니다.');
    }
  };

  const filteredRequests = requests.filter(request => {
    // 검색 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        request.requesterName.toLowerCase().includes(searchLower) ||
        request.prayerContent.toLowerCase().includes(searchLower) ||
        (request.answeredTestimony && request.answeredTestimony.toLowerCase().includes(searchLower))
      );
      if (!matchesSearch) return false;
    }

    // 상태 필터
    if (statusFilter.length > 0 && !statusFilter.includes(request.status)) {
      return false;
    }

    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-[#EAF1FE] text-[#2563EB]';
      case 'answered': return 'bg-[#E7F6EC] text-[#16A34A]';
      case 'closed': return 'bg-[#F1F4F9] text-[#64748B]';
      default: return 'bg-[#F1F4F9] text-[#64748B]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '진행중';
      case 'answered': return '응답됨';
      case 'closed': return '종료됨';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'general': return '일반';
      case 'healing': return '치유';
      case 'family': return '가정';
      case 'work': return '직장';
      case 'ministry': return '사역';
      default: return type;
    }
  };

  // 시안 매핑 — 기도 유형 칩 색 페어
  const getTypeChipClass = (type: string): string => {
    switch (type) {
      case 'general': return 'bg-[#F1F4F9] text-[#64748B]';
      case 'healing': return 'bg-[#EAF1FE] text-[#2563EB]';
      case 'family': return 'bg-[#F0E6EF] text-[#8A5A86]';
      case 'work': return 'bg-[#FBF1E3] text-[#B45309]';
      case 'ministry': return 'bg-[#E7F6EC] text-[#16A34A]';
      default: return 'bg-[#F1F4F9] text-[#64748B]';
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="중보기도 관리"
      />

      {/* KPI strip — 전체 / 진행중 / 응답됨 / 긴급 */}
      {stats && (
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Card>
            <div className="flex items-center gap-3 px-4 py-[14px]">
              <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#EEF3FC] text-primary">
                <Heart className="h-[18px] w-[18px]" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-muted-foreground">전체 요청</div>
                <div className="text-[23px] font-bold leading-tight tracking-[-0.02em]">{stats.total}</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3 px-4 py-[14px]">
              <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#EAF1FE] text-[#2563EB]">
                <Clock className="h-[18px] w-[18px]" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-muted-foreground">진행 중</div>
                <div className="text-[23px] font-bold leading-tight tracking-[-0.02em]">{stats.active}</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3 px-4 py-[14px]">
              <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#E7F6EC] text-[#16A34A]">
                <Check className="h-[18px] w-[18px]" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-muted-foreground">응답됨</div>
                <div className="text-[23px] font-bold leading-tight tracking-[-0.02em]">{stats.answered}</div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3 px-4 py-[14px]">
              <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[#FCEBEB] text-[#DC2626]">
                <AlertTriangle className="h-[18px] w-[18px]" />
              </div>
              <div>
                <div className="text-[12px] font-semibold text-muted-foreground">긴급</div>
                <div className="text-[23px] font-bold leading-tight tracking-[-0.02em]">{stats.urgent}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <SearchFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onClearSearch={() => setSearchTerm('')}
            searchPlaceholder="기도 요청 내용으로 검색"
            filters={[
              {
                id: 'status',
                label: '상태',
                value: statusFilter,
                options: [
                  { value: 'active', label: '진행중' },
                  { value: 'answered', label: '응답됨' },
                  { value: 'closed', label: '종료됨' },
                ],
                onChange: setStatusFilter,
              },
            ]}
          />
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-2" />
          직접 등록
        </Button>
      </div>

      {/* 기도요청 카드 그리드 — 시안 .pr-card 매핑 */}
      {loading ? (
        <Card>
          <LoadingState text="기도요청을 불러오는 중..." />
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
            <p className="text-[13px] text-muted-foreground">기도요청이 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className={cn(
                'flex cursor-pointer flex-col rounded-[12px] border border-border bg-card px-5 py-[18px] transition-colors hover:border-[#BBD4FB]',
                request.isUrgent && 'border-l-[3px] border-l-[#DC2626]'
              )}
              onClick={() => {
                setSelectedRequest(request);
                setShowDetailModal(true);
              }}
            >
              {/* head — 시안 .pr-head */}
              <div className="flex items-start gap-[11px]">
                {/* 아바타 40px — 시안 .pr-av */}
                <div className="flex h-[40px] w-[40px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-[#EEF3FC] text-primary">
                  {request.profilePhotoUrl && !request.isAnonymous ? (
                    <img
                      src={request.profilePhotoUrl}
                      alt={request.requesterName}
                      className="h-full w-full object-cover"
                    />
                  ) : request.isAnonymous ? (
                    <Heart className="h-5 w-5" />
                  ) : (
                    <span className="text-[15px] font-bold">
                      {request.requesterName?.charAt(0) || <User className="h-5 w-5" />}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {/* 이름 + 긴급 칩 */}
                  <div className="flex flex-wrap items-center gap-[7px]">
                    <span className="text-[14px] font-bold text-foreground">
                      {request.isAnonymous ? '익명' : request.requesterName}
                    </span>
                    {request.isUrgent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FCEBEB] px-[8px] py-[2px] text-[10.5px] font-bold text-[#DC2626] whitespace-nowrap">
                        <AlertTriangle className="h-3 w-3" />
                        긴급
                      </span>
                    )}
                  </div>
                  {/* 유형 칩 + 공개 · 시간 */}
                  <div className="mt-[2px] flex flex-wrap items-center gap-[6px] text-[11.5px] text-[#94A3B8]">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-[8px] py-[2px] text-[10.5px] font-bold whitespace-nowrap',
                      getTypeChipClass(request.prayerType)
                    )}>
                      {getTypeText(request.prayerType)}
                    </span>
                    <span>
                      {request.isPublic ? '전체 공개' : '비공개'} · {formatTimeAgo(request.createdAt) || formatDate(request.createdAt)}
                    </span>
                  </div>
                </div>

                {/* 상태 칩 (우측 상단) */}
                <span className={cn(
                  'inline-flex flex-shrink-0 rounded-full px-[11px] py-[3px] text-[11px] font-bold whitespace-nowrap',
                  getStatusColor(request.status)
                )}>
                  {getStatusText(request.status)}
                </span>
              </div>

              {/* 기도 내용 — 시안 .pr-txt */}
              <div className="my-[13px] flex-1 text-[13px] leading-[1.6] text-[#475569] line-clamp-3">
                {request.prayerContent}
              </div>

              {/* 응답 간증 — 시안 .pr-ans (있을 때만) */}
              {request.answeredTestimony && (
                <div className="mb-[13px] rounded-[10px] border border-[#CDEBD7] bg-[#F0FAF3] px-[13px] py-[11px]">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#16A34A]">
                    <Check className="h-3 w-3" />
                    응답 간증
                  </div>
                  <div className="text-[12.5px] leading-[1.5] text-[#3F7A4E]">
                    {request.answeredTestimony}
                  </div>
                </div>
              )}

              {/* 푸터 — 시안 .pr-foot */}
              <div
                className="flex items-center gap-2 border-t border-[#F1F4F9] pt-[13px]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 기도수 — 시안 .pr-cnt (빨간 하트 + 숫자) */}
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-bold text-[#DC2626]">
                  <Heart className="h-[15px] w-[15px]" />
                  {request.prayerCount}
                  <small className="text-[11.5px] font-medium text-[#94A3B8]">명</small>
                </span>

                <div className="flex-1" />

                {/* 액션 버튼 */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 bg-[#FCEBEB] text-[#DC2626] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRequest(request);
                    setShowDetailModal(true);
                  }}
                >
                  <Heart className="h-3.5 w-3.5" />
                  기도하기
                </Button>
                {request.status === 'active' ? (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequest(request);
                      setShowDetailModal(true);
                    }}
                    className="gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    응답 처리
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRequest(request);
                      setShowDetailModal(true);
                    }}
                    className="gap-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    상세
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-[#DC2626] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRequest(request);
                  }}
                  title="삭제"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Total Count Display */}
      {filteredRequests.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[12.5px] text-muted-foreground">
            전체 <b className="text-foreground">{filteredRequests.length.toLocaleString()}</b>건
          </div>
        </div>
      )}

      {/* 새 기도요청 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">새 기도요청 등록</h2>
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* 요청자 정보 */}
              <div>
                <label className="block text-sm font-medium mb-2">요청자</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newRequest.isAnonymous}
                      onChange={(e) => {
                        setNewRequest({
                          ...newRequest,
                          isAnonymous: e.target.checked,
                          memberId: e.target.checked ? '' : newRequest.memberId,
                          requesterName: e.target.checked ? '' : newRequest.requesterName,
                          requesterPhone: e.target.checked ? '' : newRequest.requesterPhone
                        });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="ml-2 text-sm">익명</span>
                  </div>
                  <div className="flex-1">
                    {newRequest.isAnonymous ? (
                      <div className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-sm text-center">
                        익명
                      </div>
                    ) : (
                      <Combobox
                        options={[...members]
                          .sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'))
                          .map(member => {
                            const details = [
                              getPositionDetailLabel(member.position_detail),
                              member.department,
                              member.organization_name
                            ].filter(Boolean).join('/');
                            return {
                              value: member.id.toString(),
                              label: details ? `${member.name}(${details})` : member.name
                            };
                          })}
                        value={newRequest.memberId}
                        onChange={(value) => {
                          const selectedMember = members.find(m => m.id.toString() === value);
                          if (selectedMember) {
                            setNewRequest({
                              ...newRequest,
                              memberId: value,
                              requesterName: selectedMember.name,
                              requesterPhone: selectedMember.phone || '',
                              organizationName: selectedMember.organization_name || '',
                              department: selectedMember.department || '',
                              profilePhotoUrl: selectedMember.profile_photo_url || ''
                            });
                          } else {
                            setNewRequest({
                              ...newRequest,
                              memberId: '',
                              requesterName: '',
                              requesterPhone: '',
                              organizationName: '',
                              department: '',
                              profilePhotoUrl: ''
                            });
                          }
                        }}
                        placeholder="교인 검색 (이름, 전화번호)"
                        emptyMessage="검색 결과가 없습니다"
                      />
                    )}
                  </div>
                </div>
              </div>

              {!newRequest.isAnonymous && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      요청자 이름 *
                    </label>
                    <input
                      type="text"
                      className={cn(
                        "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                        newRequest.memberId && "bg-gray-50 text-gray-600"
                      )}
                      value={newRequest.requesterName}
                      onChange={(e) => setNewRequest({ ...newRequest, requesterName: e.target.value })}
                      readOnly={!!newRequest.memberId}
                      placeholder={newRequest.memberId ? "교인 선택 시 자동 입력" : "요청자 이름 직접 입력"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      연락처
                    </label>
                    <input
                      type="text"
                      className={cn(
                        "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                        newRequest.memberId && "bg-gray-50 text-gray-600"
                      )}
                      value={newRequest.requesterPhone}
                      onChange={(e) => setNewRequest({ ...newRequest, requesterPhone: e.target.value })}
                      readOnly={!!newRequest.memberId}
                      placeholder={newRequest.memberId ? "교인 선택 시 자동 입력" : "010-0000-0000"}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기도 내용 *
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={newRequest.prayerContent}
                  onChange={(e) => setNewRequest({ ...newRequest, prayerContent: e.target.value })}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button
                onClick={() => setShowCreateModal(false)}
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleCreateRequest}
                className="flex-1"
              >
                등록
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 기도요청 상세 모달 */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">기도요청 상세</h2>
              <Button
                onClick={() => setShowDetailModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">요청자</label>
                  <p className="text-gray-900">{selectedRequest.isAnonymous ? '익명' : selectedRequest.requesterName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">연락처</label>
                  <p className="text-gray-900">{selectedRequest.isAnonymous ? '비공개' : (selectedRequest.requesterPhone || '없음')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">기도 유형</label>
                <p className="text-gray-900">{getTypeText(selectedRequest.prayerType)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">기도 내용</label>
                <p className="text-gray-900 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{selectedRequest.prayerContent}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">생성일</label>
                  <p className="text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">만료일</label>
                  <p className="text-gray-900">{selectedRequest.expiresAt ? formatDate(selectedRequest.expiresAt) : '없음'}</p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="flex items-center">
                  {selectedRequest.isUrgent ? (
                    <>
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-sm text-red-600">긴급</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">일반</span>
                  )}
                </div>
                <div className="flex items-center">
                  {selectedRequest.isPublic ? (
                    <>
                      <Eye className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">공개</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm text-gray-500">비공개</span>
                    </>
                  )}
                </div>
              </div>

              {selectedRequest.answeredTestimony && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">기도응답 간증</label>
                  <p className="text-gray-900 whitespace-pre-wrap bg-green-50 p-3 rounded-md border border-green-200">{selectedRequest.answeredTestimony}</p>
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">관리자 메모</label>
                  <p className="text-gray-900 whitespace-pre-wrap bg-primary-50 p-3 rounded-md border border-primary-200">{selectedRequest.adminNotes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
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

    </PageContainer>
  );
};

export default PrayerRequests;