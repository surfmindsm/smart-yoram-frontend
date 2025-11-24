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
import { Card, CardContent } from "./ui";
import { Button, Combobox } from "./ui";
import { Spinner } from "./ui/spinner";

interface Member {
  id: number;
  church_id?: number;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
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
  }, [statusFilter, typeFilter, urgentFilter, publicFilter]);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        console.log('🔍 [기도요청] 교인 목록 로딩 시작...');
        const currentUser = await supabaseAuthService.getCurrentUser();
        const userChurchId = currentUser?.user?.church_id || 9998;
        console.log('🏛️ [기도요청] Church ID:', userChurchId);

        const response = await supabaseApiService.members.getAll({ church_id: userChurchId });
        console.log('📡 [기도요청] API 응답:', response);

        const membersData = response?.data || response || [];
        console.log('📋 [기도요청] 교인 데이터 개수:', membersData.length);

        if (membersData.length > 0) {
          console.log('📝 [기도요청] 첫 번째 교인 샘플:', {
            id: membersData[0].id,
            name: membersData[0].name,
            church_id: membersData[0].church_id,
            organization_name: membersData[0].organization_name,
            department: membersData[0].department,
            profile_photo_url: membersData[0].profile_photo_url
          });
        }

        setMembers(membersData);
        console.log('✅ [기도요청] 교인 목록 설정 완료');
      } catch (error) {
        console.error('❌ [기도요청] Failed to load members:', error);
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

      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.prayer_type = typeFilter;
      if (urgentFilter !== 'all') params.is_urgent = urgentFilter === 'true';
      if (publicFilter !== 'all') params.is_public = publicFilter === 'true';

      const response = await supabaseApiService.prayerRequests.getAll(params);

      console.log('🙏 [기도요청] API 응답 전체:', response);
      console.log('🙏 [기도요청] 응답 타입:', typeof response);
      console.log('🙏 [기도요청] 응답 키들:', response ? Object.keys(response) : 'null/undefined');

      let prayerRequestsData = [];

      if (Array.isArray(response)) {
        prayerRequestsData = response;
      } else if (response && Array.isArray(response.data)) {
        prayerRequestsData = response.data;
      } else {
        console.warn('🚨 [기도요청] 예상치 못한 응답 구조:', response);
        prayerRequestsData = [];
      }

      console.log('🙏 [기도요청] 추출된 원본 데이터 개수:', prayerRequestsData.length);
      console.log('🙏 [기도요청] 추출된 원본 데이터 첫 번째 항목:', prayerRequestsData[0]);

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

      console.log('🙏 [기도요청] 변환된 데이터 개수:', transformedRequests.length);
      console.log('🙏 [기도요청] 변환된 데이터 첫 번째 항목:', transformedRequests[0]);

      setRequests(transformedRequests);
      console.log('✅ [기도요청] 상태 업데이트 완료, 총', transformedRequests.length, '개의 기도요청 데이터 로드됨');
    } catch (error) {
      console.error('Failed to load prayer requests:', error);
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
      console.error('Failed to load prayer request stats:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.requesterName || !newRequest.prayerContent) {
      alert('요청자 이름과 기도 내용을 입력해주세요.');
      return;
    }

    try {
      // 현재 사용자의 church_id 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998; // 기본값 9998

      const requestData: any = {
        church_id: userChurchId,
        member_id: newRequest.memberId ? parseInt(newRequest.memberId) : null,
        requester_name: newRequest.requesterName,
        requester_phone: newRequest.requesterPhone,
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
      console.error('Failed to create prayer request:', error);
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
      console.error('Failed to delete prayer request:', error);
      alert('기도요청 삭제에 실패했습니다.');
    }
  };

  const filteredRequests = requests.filter(request => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.requesterName.toLowerCase().includes(searchLower) ||
        request.prayerContent.toLowerCase().includes(searchLower) ||
        (request.answeredTestimony && request.answeredTestimony.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'answered': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">중보 기도 요청</h1>
        <p className="text-gray-600">교회 공동체의 기도요청을 관리하고 중보기도를 진행합니다.</p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Heart className="h-6 w-6 text-blue-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">전체 요청</p>
                  <div className="text-2xl font-bold text-foreground">{stats.total}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">진행중</p>
                  <div className="text-2xl font-bold text-foreground">{stats.active}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">응답됨</p>
                  <div className="text-2xl font-bold text-foreground">{stats.answered}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">긴급</p>
                  <div className="text-2xl font-bold text-foreground">{stats.urgent}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 및 검색 */}
      <Card className="border-muted mb-6">
        <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="검색..."
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">모든 상태</option>
            <option value="active">진행중</option>
            <option value="answered">응답됨</option>
            <option value="closed">종료됨</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">모든 유형</option>
            <option value="general">일반</option>
            <option value="healing">치유</option>
            <option value="family">가정</option>
            <option value="work">직장</option>
            <option value="ministry">사역</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={urgentFilter}
            onChange={(e) => setUrgentFilter(e.target.value)}
          >
            <option value="all">모든 우선순위</option>
            <option value="true">긴급</option>
            <option value="false">일반</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={publicFilter}
            onChange={(e) => setPublicFilter(e.target.value)}
          >
            <option value="all">모든 공개설정</option>
            <option value="true">공개</option>
            <option value="false">비공개</option>
          </select>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            새 요청
          </Button>
        </div>
        </CardContent>
      </Card>

      {/* 기도요청 목록 */}
      <Card className="border-muted">
        {loading ? (
          <div className="p-6 text-center">
            <Spinner size="default" className="inline-block" />
            <p className="mt-2 text-gray-600">로딩 중...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-6 text-center">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">기도요청이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    요청자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조직
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부서
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기도 내용
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유형
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowDetailModal(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {request.profilePhotoUrl ? (
                            <img
                              src={request.profilePhotoUrl}
                              alt={request.requesterName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {request.isAnonymous ? '익명' : request.requesterName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.organizationName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.department || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {request.prayerContent}
                      </div>
                      <div className="flex items-center mt-1">
                        {request.isUrgent && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            긴급
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getTypeText(request.prayerType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(request);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-900 h-8 w-8 p-0"
                        title="삭제"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

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
              {/* 교인 선택 (선택사항) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  교인 선택 (선택사항)
                </label>
                <Combobox
                  options={members.map(member => ({
                    value: member.id.toString(),
                    label: member.name,
                    description: member.phone ? `📱 ${member.phone}` : member.address ? `🏠 ${member.address}` : undefined
                  }))}
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
                  placeholder="교인 검색 (이름, 전화번호) - 선택 안 하면 직접 입력"
                  emptyMessage="검색 결과가 없습니다"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  요청자 이름 *
                </label>
                <input
                  type="text"
                  className={cn(
                    "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent",
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
                    "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    newRequest.memberId && "bg-gray-50 text-gray-600"
                  )}
                  value={newRequest.requesterPhone}
                  onChange={(e) => setNewRequest({ ...newRequest, requesterPhone: e.target.value })}
                  readOnly={!!newRequest.memberId}
                  placeholder={newRequest.memberId ? "교인 선택 시 자동 입력" : "010-0000-0000"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기도 유형
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newRequest.prayerType}
                  onChange={(e) => setNewRequest({ ...newRequest, prayerType: e.target.value })}
                >
                  <option value="general">일반</option>
                  <option value="healing">치유</option>
                  <option value="family">가정</option>
                  <option value="work">직장</option>
                  <option value="ministry">사역</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기도 내용 *
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newRequest.prayerContent}
                  onChange={(e) => setNewRequest({ ...newRequest, prayerContent: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={newRequest.isAnonymous}
                    onChange={(e) => setNewRequest({ ...newRequest, isAnonymous: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">익명으로 등록</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={newRequest.isUrgent}
                    onChange={(e) => setNewRequest({ ...newRequest, isUrgent: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">긴급 기도요청</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={newRequest.isPublic}
                    onChange={(e) => setNewRequest({ ...newRequest, isPublic: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">공개적으로 기도</span>
                </label>
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
                  <p className="text-gray-900 whitespace-pre-wrap bg-blue-50 p-3 rounded-md border border-blue-200">{selectedRequest.adminNotes}</p>
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

    </div>
  );
};

export default PrayerRequests;