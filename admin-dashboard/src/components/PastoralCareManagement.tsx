import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser, useMembers } from '../hooks/queries';
import { useLocation } from 'react-router-dom';
import { Button } from "./ui";
import { Input } from "./ui";
import { Card, CardContent, LoadingState } from "./ui";
import { Badge } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { Spinner } from "./ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Combobox } from "./ui";
import { SimpleTabs } from "./ui";
import { PageContainer } from "./ui";
import { usePageSubtitle, usePageActions } from '../hooks/usePageSubtitle';
import { DatePicker } from "./ui/date-picker";
import { SearchFilterBar } from './common';
import type { Filter as FilterType } from './common';
import {
  Search,
  Filter,
  Calendar,
  Eye,
  FileText,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  User,
  Users,
  Phone,
  Edit,
  Plus,
  Printer,
  MapPin,
  Navigation,
  Target,
  Map,
  Zap,
  Info,
  X,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { getPositionDetailLabel } from '../constants/memberPositions';

interface Member {
  id: number;
  user_id?: string;  // Supabase Auth user ID
  church_id?: number;
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  organization_name?: string;
  department?: string;
  profile_photo_url?: string;
  position_main?: string;
  position_detail?: string;
}

interface PastoralCareRequest {
  id: string;
  churchId: number;
  memberId?: number;
  requesterName: string;
  requesterPhone: string;
  organizationName?: string;
  department?: string;
  profilePhotoUrl?: string;
  requestType: 'general' | 'urgent' | 'hospital' | 'counseling';
  requestContent: string;
  preferredDate?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  status: 'pending' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  assignedPastorId?: string;
  assignedPastor?: {
    id: string;
    name: string;
    phone: string;
  };
  scheduledDate?: string;
  scheduledTime?: string;
  completionNotes?: string;
  adminNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
  // 🆕 새로 추가된 위치 관련 필드들
  address?: string;          // 방문 주소
  latitude?: number;         // 위도
  longitude?: number;        // 경도
  contactInfo?: string;      // 추가 연락처 정보
  isUrgent?: boolean;        // 긴급 여부
  distanceKm?: number;       // 거리 (검색 결과용)
}

interface PastoralCareRecord {
  id: string;
  requesterName: string;
  requesterPhone?: string;
  organizationName?: string;
  department?: string;
  profilePhotoUrl?: string;
  requestType: 'general' | 'urgent' | 'hospital' | 'counseling';
  requestContent: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  scheduledDate: string;
  scheduledTime: string;
  assignedPastor?: {
    id: string;
    name: string;
    phone: string;
  };
  completionNotes?: string;
  completedAt?: string;
  createdAt: string;
  // 🆕 위치 관련 필드 추가 (선택적)
  address?: string;
  latitude?: number;
  longitude?: number;
  contactInfo?: string;
  isUrgent?: boolean;
}

// 백엔드 응답 → PastoralCareRequest 변환 (부작용 없음)
const transformRequest = (item: any): PastoralCareRequest => ({
  id: item.id,
  churchId: item.church_id,
  memberId: item.member_id,
  requesterName: item.requester_name,
  requesterPhone: item.requester_phone,
  organizationName: item.organization_name,
  department: item.department,
  profilePhotoUrl: item.profile_photo_url,
  requestType: item.request_type,
  requestContent: item.request_content,
  preferredDate: item.preferred_date,
  preferredTimeStart: item.preferred_time_start,
  preferredTimeEnd: item.preferred_time_end,
  status: item.status,
  priority: item.priority || 'normal',
  assignedPastorId: item.assigned_pastor_id,
  assignedPastor: item.assigned_pastor_id ? {
    id: item.assigned_pastor_id,
    name: item.assigned_pastor?.name || '담당자 미지정',
    phone: item.assigned_pastor?.phone || ''
  } : undefined,
  scheduledDate: item.scheduled_date,
  scheduledTime: item.scheduled_time,
  completionNotes: item.completion_notes,
  adminNotes: item.admin_notes,
  createdAt: item.created_at,
  updatedAt: item.updated_at,
  completedAt: item.completed_at,
  address: item.address,
  latitude: item.latitude,
  longitude: item.longitude,
  contactInfo: item.contact_info,
  isUrgent: item.is_urgent || false,
  distanceKm: item.distance_km,
} as PastoralCareRequest);

const extractArray = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (response && Array.isArray(response.data)) return response.data;
  if (response && Array.isArray((response as any).items)) return (response as any).items;
  if (response && Array.isArray((response as any).results)) return (response as any).results;
  return [];
};

const PastoralCareManagement: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { data: cachedCurrentUser } = useCurrentUser();
  const cachedChurchId = cachedCurrentUser?.church_id ?? null;

  // React Query — 심방 신청 / 완료 기록 / 교인
  const userChurchIdForQuery = cachedChurchId ?? undefined;

  const { data: queriedMembers } = useMembers(!!userChurchIdForQuery);

  const requestsQuery = useQuery({
    queryKey: ['pastoralCare', 'requests', userChurchIdForQuery ?? 9998],
    queryFn: async () => {
      const cid = userChurchIdForQuery ?? 9998;
      const response = await supabaseApiService.pastoralCare.getAll({
        church_id: cid,
        exclude_completed: true,
      });
      return extractArray(response).map(transformRequest);
    },
    enabled: !!userChurchIdForQuery,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const recordsQuery = useQuery({
    queryKey: ['pastoralCare', 'records', userChurchIdForQuery ?? 9998],
    queryFn: async () => {
      const cid = userChurchIdForQuery ?? 9998;
      const response = await supabaseApiService.pastoralCare.getAll({
        church_id: cid,
        status: 'completed',
      });
      return extractArray(response);
    },
    enabled: !!userChurchIdForQuery,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });

  const [activeTab, setActiveTab] = useState<'requests' | 'records'>('requests');
  const [requests, setRequests] = useState<PastoralCareRequest[]>([]);
  const [completedRecords, setCompletedRecords] = useState<PastoralCareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PastoralCareRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showRecordDetailModal, setShowRecordDetailModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showAssignPastorModal, setShowAssignPastorModal] = useState(false);
  const [selectedPastorId, setSelectedPastorId] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<PastoralCareRecord | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  // 🆕 위치 관련 상태
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [searchLocation, setSearchLocation] = useState({ latitude: 37.5665, longitude: 126.9780, radius_km: 5.0 });
  const [locationSearchResults, setLocationSearchResults] = useState<PastoralCareRequest[]>([]);
  const [urgentFilter, setUrgentFilter] = useState<string>('all');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [customMinute, setCustomMinute] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  // 🆕 교인 데이터 상태
  const [members, setMembers] = useState<Member[]>([]);

  // 🆕 관리자 직접 등록 모달 상태
  const [showAdminRegistrationModal, setShowAdminRegistrationModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    memberId: '',
    requesterName: '',
    requesterPhone: '',
    requestType: 'general' as 'general' | 'urgent' | 'hospital' | 'counseling',
    requestContent: '',
    preferredDate: '',
    preferredTimeStart: '',
    priority: 'normal' as 'urgent' | 'high' | 'normal' | 'low',
    address: '',
    contactInfo: '',
    isUrgent: false
  });

  // location.state로 전달된 requestId가 있으면 자동으로 다이얼로그 열기
  useEffect(() => {
    const state = location.state as { requestId?: string; action?: string } | null;
    if (state?.requestId && requests.length > 0) {
      const targetRequest = requests.find(r => r.id === state.requestId);
      if (targetRequest) {
        setSelectedRequest(targetRequest);
        if (state.action === 'complete') {
          setShowCompletionModal(true);
        } else if (state.action === 'edit') {
          setShowScheduleModal(true);
        } else {
          setShowDetailModal(true);
        }
        // state 초기화 (뒤로가기 시 재실행 방지)
        window.history.replaceState({}, document.title);
      }
    }
  }, [requests, location.state]);

  // query 데이터 → 기존 state 동기화 (자체 필터/렌더 흐름 유지)
  useEffect(() => {
    if (requestsQuery.data) setRequests(requestsQuery.data);
  }, [requestsQuery.data]);
  useEffect(() => {
    if (queriedMembers) setMembers(queriedMembers as any);
  }, [queriedMembers]);
  useEffect(() => {
    if (!recordsQuery.data) return;
    const transformedRecords: PastoralCareRecord[] = recordsQuery.data.map((item: any) => {
      let assignedPastor: PastoralCareRecord['assignedPastor'] = undefined;
      if (item.assigned_pastor_id && item.assigned_pastor?.name) {
        assignedPastor = {
          id: item.assigned_pastor_id,
          name: item.assigned_pastor.name,
          phone: item.assigned_pastor.phone || '',
        };
      }
      return {
        id: item.id,
        requesterName: item.requester_name,
        requesterPhone: item.requester_phone,
        organizationName: item.organization_name,
        department: item.department,
        profilePhotoUrl: item.profile_photo_url,
        requestType: item.request_type,
        requestContent: item.request_content,
        priority: item.priority || 'normal',
        assignedPastor,
        scheduledDate: item.scheduled_date || '미지정',
        scheduledTime: item.scheduled_time || '미지정',
        completionNotes: item.completion_notes,
        completedAt: item.completed_at,
        createdAt: item.created_at,
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        contactInfo: item.contact_info,
        isUrgent: item.is_urgent || false,
      } as PastoralCareRecord;
    });
    setCompletedRecords(transformedRecords);
  }, [recordsQuery.data]);
  useEffect(() => {
    setLoading(requestsQuery.isLoading || recordsQuery.isLoading);
  }, [requestsQuery.isLoading, recordsQuery.isLoading]);

  // 외부 호출용: invalidate 통해 React Query가 재요청하도록
  const loadPastoralCareRequests = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pastoralCare', 'requests'] });
  };

  const loadCompletedRecords = async () => {
    await queryClient.invalidateQueries({ queryKey: ['pastoralCare', 'records'] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-[#FBF1E3] text-[#B45309]';
      case 'approved': return 'bg-[#EAF1FE] text-[#2563EB]';
      case 'scheduled': return 'bg-[#EEF3FC] text-[#1C7CFF]';
      case 'in_progress': return 'bg-[#F0E6EF] text-[#8A5A86]';
      case 'completed': return 'bg-[#E7F6EC] text-[#16A34A]';
      case 'cancelled': return 'bg-[#FCEBEB] text-[#DC2626]';
      default: return 'bg-[#F1F4F9] text-[#64748B]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'approved': return '승인됨';
      case 'scheduled': return '예정됨';
      case 'in_progress': return '진행중';
      case 'completed': return '완료됨';
      case 'cancelled': return '취소됨';
      default: return '알 수 없음';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-[#DC2626]';
      case 'high': return 'text-[#D97706]';
      case 'normal': return 'text-[#64748B]';
      case 'low': return 'text-[#94A3B8]';
      default: return 'text-[#64748B]';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return '긴급';
      case 'high': return '높음';
      case 'normal': return '보통';
      case 'low': return '낮음';
      default: return '보통';
    }
  };

  const getRequestTypeText = (type: string) => {
    switch (type) {
      case 'general': return '일반 심방';
      case 'urgent': return '긴급 심방';
      case 'hospital': return '병원 심방';
      case 'counseling': return '상담';
      default: return '일반 심방';
    }
  };

  // 시안 매핑 — 유형 칩 색 페어
  const getRequestTypeChipClass = (type: string): string => {
    switch (type) {
      case 'general': return 'bg-[#F1F4F9] text-[#64748B]';
      case 'urgent': return 'bg-[#FCEBEB] text-[#DC2626]';
      case 'hospital': return 'bg-[#EAF1FE] text-[#2563EB]';
      case 'counseling': return 'bg-[#F0E6EF] text-[#8A5A86]';
      default: return 'bg-[#F1F4F9] text-[#64748B]';
    }
  };

  // 시안 매핑 — 우선순위 색 (dot + text)
  const getPriorityDotColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#D97706';
      case 'normal': return '#64748B';
      case 'low': return '#94A3B8';
      default: return '#64748B';
    }
  };

  // 🆕 현재 위치 가져오기
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSearchLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            radius_km: 5.0
          });
        },
        (error) => {
          console.error('위치 정보 획득 실패:', error);
          alert('위치 정보를 가져올 수 없습니다. 기본 위치(서울 시청)를 사용합니다.');
        }
      );
    } else {
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.');
    }
  };
  
  // 🆕 거리 표시 포맷
  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };
  
  // 🆕 위치 기반 검색 기능
  const loadLocationBasedRequests = async () => {
    try {
      setLoading(true);
      
      // 위치 기반 검색 API 호출 (가상의 API - 실제로는 supabaseApiService.pastoralCare에 추가 필요)
      const locationSearchUrl = '/api/v1/pastoral-care/admin/requests/search/location';
      const response = await fetch(locationSearchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(searchLocation)
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocationSearchResults(data || []);
      } else {
        console.error('위치 기반 검색 실패:', response.status);
        setLocationSearchResults([]);
      }
    } catch (error) {
      console.error('위치 기반 검색 오류:', error);
      setLocationSearchResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 🆕 긴급 요청 로드 기능
  const loadUrgentRequests = async () => {
    try {
      setLoading(true);
      
      // 긴급 요청 전용 API 호출
      const urgentUrl = '/api/v1/pastoral-care/admin/requests/urgent';
      const response = await fetch(urgentUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const urgentData = await response.json();
        
        // 기존 요청 목록에서 긴급 요청만 필터링
        const transformedUrgentRequests = urgentData.map((item: any) => ({
          id: item.id,
          churchId: item.church_id,
          memberId: item.member_id,
          requesterName: item.requester_name,
          requesterPhone: item.requester_phone,
          requestType: item.request_type,
          requestContent: item.request_content,
          preferredDate: item.preferred_date,
          preferredTimeStart: item.preferred_time_start,
          preferredTimeEnd: item.preferred_time_end,
          status: item.status,
          priority: item.priority || 'normal',
          assignedPastorId: item.assigned_pastor_id,
          assignedPastor: item.assigned_pastor_id ? {
            id: item.assigned_pastor_id,
            name: item.assigned_pastor?.name || '담당자 미지정',
            phone: item.assigned_pastor?.phone || ''
          } : undefined,
          scheduledDate: item.scheduled_date,
          scheduledTime: item.scheduled_time,
          completionNotes: item.completion_notes,
          adminNotes: item.admin_notes,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          completedAt: item.completed_at,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          contactInfo: item.contact_info,
          isUrgent: item.is_urgent || false
        }));
        
        setRequests(transformedUrgentRequests);
      } else {
        console.error('긴급 요청 로드 실패:', response.status);
        setRequests([]);
      }
    } catch (error) {
      console.error('긴급 요청 로드 오류:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 🆕 위치 정보 있는 요청 로드
  const loadRequestsWithLocation = async () => {
    try {
      setLoading(true);
      
      const withLocationUrl = '/api/v1/pastoral-care/admin/requests/with-location';
      const response = await fetch(withLocationUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const locationData = await response.json();
        
        const transformedLocationRequests = locationData.map((item: any) => ({
          id: item.id,
          churchId: item.church_id,
          memberId: item.member_id,
          requesterName: item.requester_name,
          requesterPhone: item.requester_phone,
          requestType: item.request_type,
          requestContent: item.request_content,
          preferredDate: item.preferred_date,
          preferredTimeStart: item.preferred_time_start,
          preferredTimeEnd: item.preferred_time_end,
          status: item.status,
          priority: item.priority || 'normal',
          assignedPastorId: item.assigned_pastor_id,
          assignedPastor: item.assigned_pastor_id ? {
            id: item.assigned_pastor_id,
            name: item.assigned_pastor?.name || '담당자 미지정',
            phone: item.assigned_pastor?.phone || ''
          } : undefined,
          scheduledDate: item.scheduled_date,
          scheduledTime: item.scheduled_time,
          completionNotes: item.completion_notes,
          adminNotes: item.admin_notes,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          completedAt: item.completed_at,
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          contactInfo: item.contact_info,
          isUrgent: item.is_urgent || false
        }));
        
        setRequests(transformedLocationRequests);
      } else {
        console.error('위치 정보 있는 요청 로드 실패:', response.status);
        setRequests([]);
      }
    } catch (error) {
      console.error('위치 정보 있는 요청 로드 오류:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.address && request.address.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(request.status);
    const matchesPriority = priorityFilter.length === 0 || priorityFilter.includes(request.priority);
    const matchesType = typeFilter.length === 0 || typeFilter.includes(request.requestType);

    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const filteredRecords = completedRecords;

  const handleViewDetails = (request: PastoralCareRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleSchedule = (request: PastoralCareRequest) => {
    setSelectedRequest(request);
    setScheduledDate(request.preferredDate || '');
    setScheduledTime('');
    setShowScheduleModal(true);
  };


  const handleApprove = async (request: PastoralCareRequest) => {
    console.log('🏥 [심방 승인] 시작:', {
      requestId: request.id,
      memberId: request.memberId,
      requesterName: request.requesterName,
      currentStatus: request.status,
      newStatus: 'approved'
    });

    try {
      console.log('🏥 [심방 승인] API 호출 중...');

      await supabaseApiService.pastoralCare.update(request.id, {
        status: 'approved',
        admin_notes: '승인됨'
      });

      console.log('✅ [심방 승인] API 호출 성공 - 상태가 approved로 변경됨');
      console.log('📱 [심방 승인] 데이터베이스 트리거가 발동되어 푸시 알림이 발송됩니다');

      setRequests(prev =>
        prev.map(req =>
          req.id === request.id
            ? { ...req, status: 'approved' as const, adminNotes: '승인됨' }
            : req
        )
      );

      console.log('🏥 [심방 승인] UI 업데이트 완료');
    } catch (error) {
      console.error('❌ [심방 승인] 실패:', error);
    }
  };

  const handleReject = (request: PastoralCareRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleSaveRejection = async () => {
    if (!selectedRequest || !rejectionReason) return;

    try {
      await supabaseApiService.pastoralCare.update(selectedRequest.id, {
        status: 'cancelled',
        admin_notes: `거부됨: ${rejectionReason}`,
        rejection_reason: rejectionReason
      });
      
      setRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? { 
                ...req, 
                status: 'cancelled' as const, 
                adminNotes: `거부됨: ${rejectionReason}`,
                rejectionReason: rejectionReason
              }
            : req
        )
      );
      
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleSaveSchedule = async () => {
    if (!selectedRequest || !scheduledDate || !scheduledTime) return;

    try {
      await supabaseApiService.pastoralCare.update(selectedRequest.id, {
        status: 'scheduled',
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime
      });
      
      setRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? { 
                ...req, 
                status: 'scheduled' as const, 
                scheduledDate: scheduledDate,
                scheduledTime: scheduledTime 
              }
            : req
        )
      );
      
      setShowScheduleModal(false);
      setScheduledDate('');
      setScheduledTime('');
      setCustomMinute('');
    } catch (error) {
      console.error('Failed to schedule request:', error);
    }
  };

  const handleAssignPastor = (request: PastoralCareRequest) => {
    setSelectedRequest(request);
    setSelectedPastorId(request.assignedPastorId?.toString() || 'unassigned');
    setShowAssignPastorModal(true);
  };

  const handleSaveAssignPastor = async () => {
    if (!selectedRequest) return;

    try {
      // 담당자 정보 찾기
      const pastor = selectedPastorId !== 'unassigned'
        ? members.find(m => m.id.toString() === selectedPastorId)
        : undefined;

      // user_id를 사용 (users 테이블의 외래 키)
      const userIdToSave = pastor?.user_id || '';
      await supabaseApiService.pastoralCare.assignPastor(selectedRequest.id, userIdToSave);

      setRequests(prev =>
        prev.map(req =>
          req.id === selectedRequest.id
            ? {
                ...req,
                assignedPastorId: pastor?.user_id,
                assignedPastor: pastor ? {
                  id: pastor.user_id || '',
                  name: pastor.name,
                  phone: pastor.phone || ''
                } : undefined
              }
            : req
        )
      );

      setShowAssignPastorModal(false);
      setSelectedPastorId('');
      alert(pastor ? '담당자가 배정되었습니다.' : '담당자 배정이 해제되었습니다.');
    } catch (error) {
      console.error('Failed to assign pastor:', error);
      alert('담당자 배정에 실패했습니다.');
    }
  };

  const handleCompleteVisit = (request: PastoralCareRequest) => {
    setSelectedRequest(request);
    setCompletionNotes('');
    setShowCompletionModal(true);
  };

  const handleSaveCompletion = async () => {
    if (!selectedRequest || !completionNotes.trim()) {
      alert('심방 기록을 입력해주세요.');
      return;
    }

    try {
      // 현재 사용자 정보 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userId = currentUser?.user?.id;

      if (!userId) {
        alert('사용자 정보를 가져올 수 없습니다.');
        return;
      }

      // 심방 신청을 완료 상태로 업데이트 - completeRequest 엔드포인트 사용
      const response = await supabaseApiService.pastoralCare.complete(selectedRequest.id, {
        completion_notes: completionNotes,
        completed_at: new Date().toISOString(),
        assigned_pastor_id: userId  // 현재 사용자를 작성자로 기록
      });

      // 현재 사용자 정보를 members에서 찾기 (user_id로 매칭)
      const currentUserMember = members.find(m => m.user_id === userId);
      const assignedPastor = currentUserMember ? {
        id: userId,
        name: currentUserMember.name,
        phone: currentUserMember.phone || ''
      } : {
        id: userId,
        name: currentUser?.user?.name || '작성자',
        phone: ''
      };

      // 완료된 심방을 기록 목록에 추가
      const completedRecord: PastoralCareRecord = {
        id: selectedRequest.id,
        requesterName: selectedRequest.requesterName,
        requesterPhone: selectedRequest.requesterPhone,
        organizationName: selectedRequest.organizationName,
        department: selectedRequest.department,
        profilePhotoUrl: selectedRequest.profilePhotoUrl,
        requestType: selectedRequest.requestType,
        requestContent: selectedRequest.requestContent,
        priority: selectedRequest.priority,
        scheduledDate: selectedRequest.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: selectedRequest.scheduledTime || '미지정',
        assignedPastor: assignedPastor,  // 현재 사용자를 작성자로 설정
        completionNotes: completionNotes,
        completedAt: new Date().toISOString(),
        createdAt: selectedRequest.createdAt,
        // 🆕 위치 관련 정보 포함
        address: selectedRequest.address,
        latitude: selectedRequest.latitude,
        longitude: selectedRequest.longitude,
        contactInfo: selectedRequest.contactInfo,
        isUrgent: selectedRequest.isUrgent
      };

      setCompletedRecords(prev => [completedRecord, ...prev]);

      // 요청 목록에서 완료된 항목 제거
      setRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      
      // 탭 바 카운트 즉시 업데이트를 위해 상태 강제 업데이트
      setActiveTab(prev => prev); // 리렌더링 트리거
      
      setShowCompletionModal(false);
      setCompletionNotes('');
      alert('심방이 완료되었고 기록이 저장되었습니다.');
    } catch (error: any) {
      console.error('❌ 심방 완료 처리 실패:', error);
      console.error('📄 에러 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      if (error.response?.data) {
        console.error('🚨 서버 응답 데이터:', JSON.stringify(error.response.data, null, 2));
      }
      
      alert(`심방 완료 처리에 실패했습니다.\n에러: ${error.response?.data?.detail || error.message}`);
    }
  };

  // 심방 신청 삭제 함수
  const handleDelete = async (request: PastoralCareRequest) => {
    const confirmMessage = `⚠️ 경고: 심방 신청 완전 삭제\n\n` +
      `신청자: ${request.requesterName}님\n` +
      `상태: ${getStatusText(request.status)}\n\n` +
      `이 작업은 되돌릴 수 없으며, 모든 기록이 영구적으로 삭제됩니다.\n\n` +
      `💡 참고: 기록을 보존하려면 "반려" 기능을 사용하세요.\n\n` +
      `정말로 삭제하시겠습니까?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await supabaseApiService.pastoralCare.delete(request.id);

      // 신청 목록에서 삭제된 항목 제거
      setRequests(prev => prev.filter(req => req.id !== request.id));

      alert('심방 신청이 삭제되었습니다.');
    } catch (error: any) {
      console.error('❌ 심방 신청 삭제 실패:', error);
      alert(`심방 신청 삭제에 실패했습니다.\n에러: ${error.response?.data?.detail || error.message}`);
    }
  };

  // 심방 기록 삭제 함수
  const handleDeleteRecord = async (record: PastoralCareRecord) => {
    const confirmMessage = `⚠️ 경고: 심방 기록 완전 삭제\n\n` +
      `신청자: ${record.requesterName}님\n` +
      `완료일: ${record.completedAt ? new Date(record.completedAt).toLocaleDateString('ko-KR') : '정보 없음'}\n\n` +
      `이 작업은 되돌릴 수 없으며, 모든 심방 기록이 영구적으로 삭제됩니다.\n\n` +
      `정말로 삭제하시겠습니까?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await supabaseApiService.pastoralCare.delete(record.id);

      // 기록 목록에서 삭제된 항목 제거
      setCompletedRecords(prev => prev.filter(rec => rec.id !== record.id));

      alert('심방 기록이 삭제되었습니다.');
    } catch (error: any) {
      console.error('❌ 심방 기록 삭제 실패:', error);
      alert(`심방 기록 삭제에 실패했습니다.\n에러: ${error.response?.data?.detail || error.message}`);
    }
  };

  // 🆕 관리자 직접 등록 함수
  const handleAdminRegistration = async () => {
    try {
      if (!newRequest.requesterName || !newRequest.requesterPhone || !newRequest.requestContent) {
        alert('필수 정보(신청자명, 연락처, 신청내용)를 모두 입력해주세요.');
        return;
      }

      // 현재 사용자의 church_id 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998;

      const requestData: any = {
        church_id: userChurchId,
        requester_name: newRequest.requesterName,
        requester_phone: newRequest.requesterPhone,
        request_type: newRequest.requestType,
        request_content: newRequest.requestContent,
        preferred_date: newRequest.preferredDate || null,
        preferred_time_start: newRequest.preferredTimeStart || null,
        priority: newRequest.priority,
        address: newRequest.address || null,
        contact_info: newRequest.contactInfo || null,
        is_urgent: newRequest.isUrgent
      };

      // member_id 전송 (members 테이블 조인용)
      if (newRequest.memberId) {
        requestData.member_id = parseInt(newRequest.memberId);
      }

      console.log('📤 [심방 신청] 전송 데이터:', requestData);
      console.log('📤 [심방 신청] member_id:', newRequest.memberId);

      await supabaseApiService.pastoralCare.create(requestData);
      
      // 등록 성공 후 목록 새로고침
      await loadPastoralCareRequests();
      
      // 폼 초기화
      setNewRequest({
        memberId: '',
        requesterName: '',
        requesterPhone: '',
        requestType: 'general',
        requestContent: '',
        preferredDate: '',
        preferredTimeStart: '',
        priority: 'normal',
        address: '',
        contactInfo: '',
        isUrgent: false
      });
      
      setShowAdminRegistrationModal(false);
      alert('심방 신청이 성공적으로 등록되었습니다.');
    } catch (error: any) {
      console.error('관리자 심방 신청 등록 실패:', error);
      alert(`심방 신청 등록에 실패했습니다.\n에러: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handlePrintCard = (request: PastoralCareRequest) => {
    // 성도 정보를 조회하여 심방 카드 인쇄 준비
    setSelectedRequest(request);
    // 실제로는 성도 정보 API를 호출해야 하지만, 여기서는 기본 정보 사용
    setSelectedMember({
      name: request.requesterName,
      phone: request.requesterPhone,
      address: '주소 미등록',
      family: [],
      recentVisits: []
    });
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRecordDetail = (record: PastoralCareRecord) => {
    setSelectedRecord(record);
    setEditingNotes(record.completionNotes || '');
    setShowRecordDetailModal(true);
  };

  const handleUpdateNotes = async () => {
    if (!selectedRecord) return;

    const updateData = {
      completion_notes: editingNotes
    };

    try {
      // API 호출로 일지 내용 업데이트 - completeRequest 엔드포인트 사용
      const response = await supabaseApiService.pastoralCare.complete(selectedRecord.id, updateData);
      const updatedRecord = await supabaseApiService.pastoralCare.getById(selectedRecord.id);

      // 로컬 상태 업데이트
      setCompletedRecords(prev => prev.map(record => 
        record.id === selectedRecord.id 
          ? { ...record, completionNotes: editingNotes }
          : record
      ));
      
      // 선택된 기록 업데이트
      setSelectedRecord(prev => prev ? { ...prev, completionNotes: editingNotes } : null);

      setShowRecordDetailModal(false);
      
      if ((updatedRecord as any)?.completion_notes === editingNotes) {
        alert('심방 일지가 수정되었습니다.');
      } else {
        alert('⚠️ 프론트엔드는 성공했지만 DB 업데이트를 확인할 수 없습니다. 백엔드 확인이 필요합니다.');
      }
    } catch (error: any) {
      console.error('❌ 심방 일지 수정 실패:', error);
      console.error('📄 에러 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(`심방 일지 수정에 실패했습니다.\n에러: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleStatusChange = (requestId: string, newStatus: string) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: newStatus as any, updatedAt: new Date().toISOString() }
          : req
      )
    );
  };

  // 상단바 부제·액션 (Hook은 early return 전에 호출)
  usePageSubtitle(
    activeTab === 'requests'
      ? `대기 ${requests.filter(r => r.status === 'pending').length}건 · 이번 달 완료 ${completedRecords.filter(r => {
          const completedAt = new Date(r.completedAt || r.createdAt);
          const thisMonth = new Date();
          return completedAt.getMonth() === thisMonth.getMonth() && completedAt.getFullYear() === thisMonth.getFullYear();
        }).length}건`
      : `완료 ${completedRecords.length}건`
  );
  usePageActions(
    <Button
      onClick={() => setShowAdminRegistrationModal(true)}
      size="sm"
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      심방 신청
    </Button>,
    [activeTab]
  );

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <LoadingState text="심방 목록을 불러오는 중..." />
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SimpleTabs
        tabs={[
          {
            id: 'requests',
            label: '심방 신청',
            icon: <Users className="h-4 w-4" />,
            count: requests.length
          },
          {
            id: 'records',
            label: '심방 기록',
            icon: <FileText className="h-4 w-4" />,
            count: completedRecords.length
          }
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'requests' | 'records')}
        variant="default"
        className="mb-6"
      />

      {/* 신청 관리 탭 — KPI strip (시안: 대기 / 승인·예약 / 진행 중 / 이번 달 완료) */}
      {activeTab === 'requests' && (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card>
            <div className="px-4 py-[14px]">
              <div className="text-[12px] font-semibold text-muted-foreground">대기 중</div>
              <div className="mt-[6px] text-[24px] font-bold leading-none tracking-[-0.02em]">
                {requests.filter(r => r.status === 'pending').length}
                <span className="ml-1 text-[13px] font-semibold text-[#94A3B8]">건</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="px-4 py-[14px]">
              <div className="text-[12px] font-semibold text-muted-foreground">승인 · 예약</div>
              <div className="mt-[6px] text-[24px] font-bold leading-none tracking-[-0.02em]">
                {requests.filter(r => r.status === 'approved' || r.status === 'scheduled').length}
                <span className="ml-1 text-[13px] font-semibold text-[#94A3B8]">건</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="px-4 py-[14px]">
              <div className="text-[12px] font-semibold text-muted-foreground">진행 중</div>
              <div className="mt-[6px] text-[24px] font-bold leading-none tracking-[-0.02em]">
                {requests.filter(r => r.status === 'in_progress').length}
                <span className="ml-1 text-[13px] font-semibold text-[#94A3B8]">건</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="px-4 py-[14px]">
              <div className="text-[12px] font-semibold text-muted-foreground">이번 달 완료</div>
              <div className="mt-[6px] text-[24px] font-bold leading-none tracking-[-0.02em]">
                {requests.filter(r => {
                  if (r.status !== 'completed') return false;
                  const at = new Date(r.createdAt);
                  const now = new Date();
                  return at.getMonth() === now.getMonth() && at.getFullYear() === now.getFullYear();
                }).length}
                <span className="ml-1 text-[13px] font-semibold text-[#94A3B8]">건</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 심방 기록 탭 — Direction C KPI strip */}
      {activeTab === 'records' && (
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Card>
            <div className="px-4 py-[14px]">
              <div className="text-[12px] font-semibold text-muted-foreground">총 심방 완료</div>
              <div className="mt-[6px] text-[24px] font-bold leading-none tracking-[-0.02em]">
                {completedRecords.length}
                <span className="ml-1 text-[13px] font-semibold text-[#94A3B8]">건</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="px-4 py-[14px]">
              <div className="text-[12px] font-semibold text-muted-foreground">이번 달</div>
              <div className="mt-[6px] text-[24px] font-bold leading-none tracking-[-0.02em]">
                {completedRecords.filter(r => {
                  const completedAt = new Date(r.completedAt || r.createdAt);
                  const thisMonth = new Date();
                  return completedAt.getMonth() === thisMonth.getMonth() &&
                         completedAt.getFullYear() === thisMonth.getFullYear();
                }).length}
                <span className="ml-1 text-[13px] font-semibold text-[#94A3B8]">건</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="px-4 py-[14px]">
              <div className="text-[12px] font-semibold text-muted-foreground">병원 심방</div>
              <div className="mt-[6px] text-[24px] font-bold leading-none tracking-[-0.02em]">
                {completedRecords.filter(r => r.requestType === 'hospital').length}
                <span className="ml-1 text-[13px] font-semibold text-[#94A3B8]">건</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="px-4 py-[14px]">
              <div className="text-[12px] font-semibold text-muted-foreground">일지 작성</div>
              <div className="mt-[6px] text-[24px] font-bold leading-none tracking-[-0.02em]">
                {completedRecords.filter(r => r.completionNotes && r.completionNotes.trim()).length}
                <span className="ml-1 text-[13px] font-semibold text-[#94A3B8]">건</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 검색 및 필터 — 시안 .pc-filter 매핑 */}
      <SearchFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSearch={() => setSearchTerm('')}
        searchPlaceholder="이름, 내용으로 검색"
        filters={[
          {
            id: 'status',
            label: '상태',
            value: statusFilter,
            options: [
              { value: 'pending', label: '대기중' },
              { value: 'approved', label: '승인됨' },
              { value: 'scheduled', label: '예정됨' },
              { value: 'in_progress', label: '진행중' },
              { value: 'completed', label: '완료됨' },
              { value: 'cancelled', label: '취소됨' },
            ],
            onChange: setStatusFilter,
          },
          {
            id: 'priority',
            label: '우선순위',
            value: priorityFilter,
            options: [
              { value: 'urgent', label: '긴급' },
              { value: 'high', label: '높음' },
              { value: 'normal', label: '보통' },
              { value: 'low', label: '낮음' },
            ],
            onChange: setPriorityFilter,
          },
          {
            id: 'type',
            label: '유형',
            value: typeFilter,
            options: [
              { value: 'general', label: '일반' },
              { value: 'urgent', label: '긴급' },
              { value: 'hospital', label: '병원' },
              { value: 'counseling', label: '상담' },
            ],
            onChange: setTypeFilter,
          },
        ]}
      />

      {/* 신청 관리 카드 리스트 — 시안 .pc-card 매핑 */}
      {activeTab === 'requests' && (
        <>
          {filteredRequests.length === 0 ? (
            <Card>
              <div className="py-12 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-[#94A3B8]" />
                <p className="text-[13px] text-muted-foreground">조건에 맞는 심방 신청이 없습니다.</p>
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredRequests.map((request) => {
                const isUrgent = request.priority === 'urgent' || (request as any).isUrgent;
                const priColor = getPriorityDotColor(request.priority);
                return (
                  <div
                    key={request.id}
                    className={cn(
                      'flex cursor-pointer gap-4 rounded-[12px] border border-border bg-card px-5 py-[18px] transition-colors hover:border-[#BBD4FB]',
                      isUrgent && 'border-l-[3px] border-l-[#DC2626]'
                    )}
                    onClick={() => handleViewDetails(request)}
                  >
                    {/* 아바타 — 시안 .pc-av (44px rounded-[11px]) */}
                    <div className="flex h-[44px] w-[44px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-[#EEF3FC] text-primary">
                      {request.profilePhotoUrl ? (
                        <img
                          src={request.profilePhotoUrl}
                          alt={request.requesterName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-[16px] font-bold">
                          {request.requesterName?.charAt(0) || <User className="h-5 w-5" />}
                        </span>
                      )}
                    </div>

                    {/* 메인 — 시안 .pc-main */}
                    <div className="min-w-0 flex-1">
                      {/* 상단: 이름 · 유형 칩 · 우선순위 dot */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[15px] font-bold text-foreground">
                          {request.requesterName}
                        </span>
                        <span className={cn(
                          'inline-flex items-center rounded-full px-[8px] py-[2px] text-[10.5px] font-bold whitespace-nowrap',
                          getRequestTypeChipClass(request.requestType)
                        )}>
                          {getRequestTypeText(request.requestType).replace(' 심방', '')}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 text-[11.5px] font-bold whitespace-nowrap"
                          style={{ color: priColor }}
                        >
                          <span
                            className="h-[6px] w-[6px] rounded-full"
                            style={{ background: priColor }}
                          />
                          {getPriorityText(request.priority)}
                        </span>
                      </div>

                      {/* 신청 내용 — 시안 .pc-txt */}
                      {request.requestContent && (
                        <div className="mt-[9px] text-[13px] leading-[1.55] text-[#475569] line-clamp-2">
                          {request.requestContent}
                        </div>
                      )}

                      {/* 메타 — 시안 .pc-meta */}
                      <div className="mt-[11px] flex flex-wrap items-center gap-x-[18px] gap-y-1.5">
                        {(request.preferredDate || request.scheduledDate) && (
                          <span className="inline-flex items-center gap-1.5 text-[12px] text-[#64748B]">
                            <Calendar className="h-3.5 w-3.5 text-[#94A3B8]" />
                            {request.scheduledDate
                              ? `${request.scheduledDate}${request.scheduledTime ? ' ' + request.scheduledTime : ''}`
                              : request.preferredDate}
                          </span>
                        )}
                        {request.requesterPhone && (
                          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-[#64748B]">
                            <Phone className="h-3.5 w-3.5 text-[#94A3B8]" />
                            {request.requesterPhone}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[#64748B]">
                          <Users className="h-3.5 w-3.5 text-[#94A3B8]" />
                          {request.assignedPastor ? request.assignedPastor.name : '담당 미정'}
                        </span>
                        {(request.organizationName || request.department) && (
                          <span className="text-[12px] text-[#94A3B8]">
                            {[request.organizationName, request.department].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 우측 — 시안 .pc-side (상태 칩 위, 액션 아래) */}
                    <div
                      className="flex flex-shrink-0 flex-col items-end gap-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className={cn(
                        'inline-flex rounded-full px-[11px] py-[3px] text-[11px] font-bold whitespace-nowrap',
                        getStatusColor(request.status)
                      )}>
                        {getStatusText(request.status)}
                      </span>
                      {/* 상태별 핵심 액션 2개로 압축 (시안 매핑) — 그 외 액션은 상세 모달에서 */}
                      <div className="flex items-center justify-end gap-1.5">
                        {request.status === 'pending' && !request.assignedPastor && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleViewDetails(request); }}
                            >
                              상세
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleAssignPastor(request); }}
                            >
                              담당자 배정
                            </Button>
                          </>
                        )}
                        {request.status === 'pending' && request.assignedPastor && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleReject(request); }}
                            >
                              반려
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleApprove(request); }}
                            >
                              승인
                            </Button>
                          </>
                        )}
                        {request.status === 'approved' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleViewDetails(request); }}
                            >
                              상세
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleSchedule(request); }}
                            >
                              일정 잡기
                            </Button>
                          </>
                        )}
                        {(request.status === 'scheduled' || request.status === 'in_progress') && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); handleViewDetails(request); }}
                            >
                              상세
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); setSelectedRequest(request); setShowCompletionModal(true); }}
                            >
                              완료 처리
                            </Button>
                          </>
                        )}
                        {(request.status === 'completed' || request.status === 'cancelled') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); handleViewDetails(request); }}
                          >
                            상세
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Total Count Display for Requests */}
      {activeTab === 'requests' && filteredRequests.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[12.5px] text-muted-foreground">
            전체 <b className="text-foreground">{filteredRequests.length.toLocaleString()}</b>건
          </div>
        </div>
      )}

      {/* 심방 기록 목록 */}
      {activeTab === 'records' && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-[12.5px]">
              <thead className="bg-[#FAFBFD]">
                <tr>
                  {['신청자', '조직', '부서', '심방 유형', '우선순위', '심방일', '담당자', '완료일', '일지'].map((h) => (
                    <th key={h} className="px-[18px] py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">
                      {h}
                    </th>
                  ))}
                  <th className="px-[18px] py-3 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F4F9] bg-card">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <FileText className="mb-3 h-12 w-12 text-[#94A3B8]" />
                        <p className="text-[14px] font-bold text-foreground">심방 기록이 없습니다</p>
                        <p className="mt-1 text-[12.5px] text-muted-foreground">완료된 심방이 없거나 필터 조건에 맞는 기록이 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="transition-colors hover:bg-[#FAFBFD]">
                      <td className="px-[18px] py-3 whitespace-nowrap">
                        <div className="flex items-center gap-[11px]">
                          <div className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-[#EEF3FC] text-primary">
                            {record.profilePhotoUrl ? (
                              <img src={record.profilePhotoUrl} alt={record.requesterName} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-[13px] font-bold">
                                {record.requesterName?.charAt(0) || <User className="h-4 w-4" />}
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-foreground">{record.requesterName}</div>
                        </div>
                      </td>
                      <td className="px-[18px] py-3 whitespace-nowrap text-muted-foreground">{record.organizationName || '-'}</td>
                      <td className="px-[18px] py-3 whitespace-nowrap text-muted-foreground">{record.department || '-'}</td>
                      <td className="px-[18px] py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="text-foreground">{getRequestTypeText(record.requestType)}</span>
                          {(record as any).isUrgent && (
                            <Badge variant="danger" className="gap-1">
                              <Zap className="h-3 w-3" />
                              긴급
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-[18px] py-3 whitespace-nowrap">
                        <span className={cn("font-medium", getPriorityColor(record.priority))}>
                          {getPriorityText(record.priority)}
                        </span>
                      </td>
                      <td className="px-[18px] py-3 whitespace-nowrap text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-[#94A3B8]" />
                          {record.scheduledDate} {record.scheduledTime}
                        </div>
                      </td>
                      <td className="px-[18px] py-3 whitespace-nowrap text-foreground">
                        {record.assignedPastor?.name || '미지정'}
                      </td>
                      <td className="px-[18px] py-3 whitespace-nowrap text-foreground">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-[#16A34A]" />
                          {record.completedAt ? new Date(record.completedAt).toLocaleDateString('ko-KR') : '-'}
                        </div>
                      </td>
                      <td className="px-[18px] py-3 whitespace-nowrap">
                        {record.completionNotes ? (
                          <Badge variant="success" className="gap-1">
                            <FileText className="h-3 w-3" />
                            작성완료
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            미작성
                          </Badge>
                        )}
                      </td>
                      <td className="px-[18px] py-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRecordDetail(record)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            상세보기
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDeleteRecord(record); }}
                            className="gap-1 text-[#DC2626] hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                          >
                            <Trash2 className="h-4 w-4" />
                            삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Total Count Display for Records */}
      {activeTab === 'records' && filteredRecords.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-[12.5px] text-muted-foreground">
            전체 <b className="text-foreground">{filteredRecords.length.toLocaleString()}</b>건
          </div>
        </div>
      )}

      {/* 상세 보기 모달 — Dialog 기반, Direction C 톤 통일 */}
      <Dialog open={showDetailModal && !!selectedRequest} onOpenChange={(open) => !open && setShowDetailModal(false)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>심방 신청 상세</DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="mt-2 space-y-5">
              {/* 신청자 + 신청 정보 — 2열 라벨/값 그리드 */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">신청자 정보</h3>
                  <dl className="space-y-1.5 text-[13px]">
                    <div className="flex gap-2">
                      <dt className="w-[72px] text-muted-foreground">이름</dt>
                      <dd className="font-semibold text-foreground">{selectedRequest.requesterName}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-[72px] text-muted-foreground">전화번호</dt>
                      <dd className="text-foreground tabular-nums">{selectedRequest.requesterPhone || '-'}</dd>
                    </div>
                  </dl>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">신청 정보</h3>
                  <dl className="space-y-1.5 text-[13px]">
                    <div className="flex gap-2">
                      <dt className="w-[72px] text-muted-foreground">유형</dt>
                      <dd className="text-foreground">{getRequestTypeText(selectedRequest.requestType)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-[72px] text-muted-foreground">우선순위</dt>
                      <dd className="text-foreground">{getPriorityText(selectedRequest.priority)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-[72px] text-muted-foreground">상태</dt>
                      <dd className="text-foreground">{getStatusText(selectedRequest.status)}</dd>
                    </div>
                  </dl>
                </section>
              </div>

              {/* 신청 내용 */}
              <section className="space-y-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">신청 내용</h3>
                <p className="rounded-[8px] bg-[#FAFBFD] p-3 text-[13px] leading-relaxed text-foreground">
                  {selectedRequest.requestContent || '-'}
                </p>
              </section>

              {/* 희망 일정 */}
              {selectedRequest.preferredDate && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">희망 일정</h3>
                  <dl className="space-y-1.5 text-[13px]">
                    <div className="flex gap-2">
                      <dt className="w-[72px] text-muted-foreground">날짜</dt>
                      <dd className="text-foreground tabular-nums">{selectedRequest.preferredDate}</dd>
                    </div>
                    {selectedRequest.preferredTimeStart && selectedRequest.preferredTimeEnd && (
                      <div className="flex gap-2">
                        <dt className="w-[72px] text-muted-foreground">시간</dt>
                        <dd className="text-foreground tabular-nums">
                          {selectedRequest.preferredTimeStart} - {selectedRequest.preferredTimeEnd}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {/* 위치 및 추가 정보 */}
              {(selectedRequest.address || selectedRequest.contactInfo || selectedRequest.isUrgent || selectedRequest.distanceKm) && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">위치 및 추가 정보</h3>
                  <div className="space-y-2">
                    {selectedRequest.address && (
                      <div className="flex items-start gap-2 rounded-[8px] bg-[#FAFBFD] p-3 text-[13px]">
                        <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#94A3B8]" />
                        <div>
                          <div className="text-[11px] font-semibold text-muted-foreground">방문 주소</div>
                          <div className="text-foreground">{selectedRequest.address}</div>
                        </div>
                      </div>
                    )}
                    {selectedRequest.contactInfo && (
                      <div className="flex items-start gap-2 rounded-[8px] bg-[#FAFBFD] p-3 text-[13px]">
                        <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#94A3B8]" />
                        <div>
                          <div className="text-[11px] font-semibold text-muted-foreground">추가 연락처 정보</div>
                          <div className="text-foreground">{selectedRequest.contactInfo}</div>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.isUrgent && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCEBEB] px-3 py-1 text-[11.5px] font-semibold text-[#DC2626]">
                          <Zap className="h-3.5 w-3.5" />
                          긴급 요청
                        </span>
                      )}
                      {selectedRequest.distanceKm && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF1FE] px-3 py-1 text-[11.5px] font-semibold text-[#2563EB]">
                          <Target className="h-3.5 w-3.5" />
                          거리 {formatDistance(selectedRequest.distanceKm)}
                        </span>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* 담당 목사 */}
              {selectedRequest.assignedPastor && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">담당 목사</h3>
                  <dl className="space-y-1.5 text-[13px]">
                    <div className="flex gap-2">
                      <dt className="w-[72px] text-muted-foreground">이름</dt>
                      <dd className="font-semibold text-foreground">{selectedRequest.assignedPastor.name}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-[72px] text-muted-foreground">전화번호</dt>
                      <dd className="text-foreground tabular-nums">{selectedRequest.assignedPastor.phone || '-'}</dd>
                    </div>
                  </dl>
                </section>
              )}

              {/* 거부 사유 */}
              {selectedRequest.rejectionReason && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">거부 사유</h3>
                  <p className="rounded-[8px] bg-[#FCEBEB] p-3 text-[13px] leading-relaxed text-[#DC2626]">
                    {selectedRequest.rejectionReason}
                  </p>
                </section>
              )}

              {/* 완료 노트 */}
              {selectedRequest.completionNotes && (
                <section className="space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#94A3B8]">완료 노트</h3>
                  <p className="rounded-[8px] bg-[#E7F6EC] p-3 text-[13px] leading-relaxed text-[#16A34A]">
                    {selectedRequest.completionNotes}
                  </p>
                </section>
              )}
            </div>
          )}

          {/* 상태별 액션 — 카드에서 압축한 만큼 상세 모달에 모음 */}
          {selectedRequest && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* 위험 액션 — 좌측 */}
                <Button
                  variant="destructive-soft"
                  size="sm"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleDelete(selectedRequest);
                  }}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* 보조 액션 */}
                {(selectedRequest.status === 'approved'
                  || selectedRequest.status === 'scheduled'
                  || selectedRequest.status === 'in_progress') && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDetailModal(false);
                        handleAssignPastor(selectedRequest);
                      }}
                    >
                      재배정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDetailModal(false);
                        handlePrintCard(selectedRequest);
                      }}
                    >
                      카드 인쇄
                    </Button>
                  </>
                )}

                {/* 상태별 핵심 액션 */}
                {selectedRequest.status === 'pending' && !selectedRequest.assignedPastor && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAssignPastor(selectedRequest);
                    }}
                  >
                    담당자 배정
                  </Button>
                )}
                {selectedRequest.status === 'pending' && selectedRequest.assignedPastor && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDetailModal(false);
                        handleReject(selectedRequest);
                      }}
                    >
                      반려
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowDetailModal(false);
                        handleApprove(selectedRequest);
                      }}
                    >
                      승인
                    </Button>
                  </>
                )}
                {selectedRequest.status === 'approved' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleSchedule(selectedRequest);
                    }}
                  >
                    일정 잡기
                  </Button>
                )}
                {(selectedRequest.status === 'scheduled' || selectedRequest.status === 'in_progress') && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowDetailModal(false);
                        handleSchedule(selectedRequest);
                      }}
                    >
                      일정 변경
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowDetailModal(false);
                        setShowCompletionModal(true);
                      }}
                    >
                      완료 처리
                    </Button>
                  </>
                )}

                <Button variant="ghost" size="sm" onClick={() => setShowDetailModal(false)}>
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 일정 변경 모달 */}
      {showScheduleModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">일정 변경</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  신청자: {selectedRequest.requesterName}
                </label>
                <p className="text-sm text-slate-500">
                  신청 일자: {new Date(selectedRequest.createdAt).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  확정 날짜
                </label>
                <DatePicker
                  value={scheduledDate}
                  onChange={(value) => setScheduledDate(value)}
                  placeholder="날짜 선택"
                  disablePast={true}
                  fromYear={2020}
                  toYear={new Date().getFullYear() + 5}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  확정 시간
                </label>
                <div className="flex gap-2">
                  <Select
                    value={(() => {
                      const hour = parseInt(scheduledTime.split(':')[0] || '0');
                      return hour >= 12 ? 'PM' : 'AM';
                    })()}
                    onValueChange={(period) => {
                      const currentHour = parseInt(scheduledTime.split(':')[0] || '0');
                      const minute = scheduledTime.split(':')[1] || '00';
                      let hour12 = currentHour % 12 || 12;
                      let newHour24 = period === 'PM' ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12);
                      setScheduledTime(`${newHour24.toString().padStart(2, '0')}:${minute}`);
                    }}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="오전/오후" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">오전</SelectItem>
                      <SelectItem value="PM">오후</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={(() => {
                      const hour = parseInt(scheduledTime.split(':')[0] || '0');
                      const hour12 = hour % 12 || 12;
                      return hour12.toString().padStart(2, '0');
                    })()}
                    onValueChange={(hour12) => {
                      const minute = scheduledTime.split(':')[1] || '00';
                      const currentHour = parseInt(scheduledTime.split(':')[0] || '0');
                      const isPM = currentHour >= 12;
                      const h12 = parseInt(hour12);
                      let newHour24 = isPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
                      setScheduledTime(`${newHour24.toString().padStart(2, '0')}:${minute}`);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="시" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => {
                        const hour = (i + 1).toString().padStart(2, '0');
                        return <SelectItem key={hour} value={hour}>{hour}시</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                  {scheduledTime.split(':')[1] === 'custom' || customMinute ? (
                    <div className="flex-1 flex gap-1">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={customMinute}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                            setCustomMinute(value);
                            if (value !== '') {
                              const hour = scheduledTime.split(':')[0] || '00';
                              setScheduledTime(`${hour}:${value.padStart(2, '0')}`);
                            }
                          }
                        }}
                        placeholder="분"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCustomMinute('');
                          const hour = scheduledTime.split(':')[0] || '00';
                          setScheduledTime(`${hour}:00`);
                        }}
                        className="px-3"
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={scheduledTime.split(':')[1] || ''}
                      onValueChange={(minute) => {
                        if (minute === 'custom') {
                          setCustomMinute('');
                          const hour = scheduledTime.split(':')[0] || '00';
                          setScheduledTime(`${hour}:custom`);
                        } else {
                          const hour = scheduledTime.split(':')[0] || '00';
                          setScheduledTime(`${hour}:${minute}`);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="분" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="00">00분</SelectItem>
                        <SelectItem value="15">15분</SelectItem>
                        <SelectItem value="30">30분</SelectItem>
                        <SelectItem value="45">45분</SelectItem>
                        <SelectItem value="custom">직접 입력</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => {
                setShowScheduleModal(false);
                setCustomMinute('');
              }}>
                취소
              </Button>
              <Button
                onClick={handleSaveSchedule}
                disabled={!scheduledDate || !scheduledTime || scheduledTime.includes('custom')}
              >
                일정 변경
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 담당자 배정 모달 */}
      {showAssignPastorModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">담당자 배정</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  신청자: {selectedRequest.requesterName}
                </label>
                <p className="text-sm text-slate-500">
                  현재 담당자: {selectedRequest.assignedPastor?.name || '미배정'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  담당자 선택
                </label>
                <Select value={selectedPastorId} onValueChange={setSelectedPastorId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="담당자를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">미배정</SelectItem>
                    {members
                      .filter(member =>
                        member.position_main === 'CLERGY' ||
                        member.position_main === '교역자'
                      )
                      .map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.name} ({member.phone || '전화번호 없음'})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                {members.filter(m => m.position_main === 'CLERGY' || m.position_main === '교역자').length === 0 && (
                  <p className="text-sm text-amber-600 mt-1">
                    등록된 교역자가 없습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowAssignPastorModal(false)}>
                취소
              </Button>
              <Button onClick={handleSaveAssignPastor}>
                배정 완료
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 거부 사유 입력 모달 */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">신청 거부</h2>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  신청자: {selectedRequest.requesterName}
                </label>
                <p className="text-sm text-slate-500">
                  신청 내용: {selectedRequest.requestContent.substring(0, 50)}...
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  거부 사유 <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  신청자가 확인할 수 있는 내용입니다. 정중하고 명확하게 작성해주세요.
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="예: 해당 날짜에 이미 다른 일정이 있어 심방이 어렵습니다. 다른 날짜로 다시 신청해주시기 바랍니다."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                취소
              </Button>
              <Button 
                onClick={handleSaveRejection} 
                disabled={!rejectionReason.trim()}
                variant="destructive"
              >
                거부 확정
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 심방 기록 완료 모달 */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">심방 기록 작성</h3>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  신청자: {selectedRequest?.requesterName}
                </label>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  전화번호: {selectedRequest?.requesterPhone}
                </label>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  심방 내용
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={4}
                  placeholder="심방 내용과 기도제목을 기록해주세요..."
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCompletionModal(false);
                  setCompletionNotes('');
                }}
              >
                취소
              </Button>
              <Button onClick={handleSaveCompletion}>
                기록 저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 심방 카드 인쇄 모달 — body 직계로 portal */}
      {showPrintModal && selectedMember && selectedRequest && createPortal(
        <>
          <style>
            {`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 10mm;
                }
                html, body {
                  background: #fff !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  height: auto !important;
                  overflow: visible !important;
                }
                /* body 직계 자식 중 print-portal만 살리고 나머지는 제거 → 빈 페이지 차단 */
                body > *:not(.print-portal) {
                  display: none !important;
                }
                /* print-portal 자체와 자식의 화면용 레이아웃 무력화 */
                .print-portal {
                  position: static !important;
                  inset: auto !important;
                  background: transparent !important;
                  display: block !important;
                  align-items: initial !important;
                  justify-content: initial !important;
                  z-index: auto !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: auto !important;
                  height: auto !important;
                  overflow: visible !important;
                  max-height: none !important;
                }
                .print-portal > * {
                  background: transparent !important;
                  box-shadow: none !important;
                  border: none !important;
                  border-radius: 0 !important;
                  max-height: none !important;
                  height: auto !important;
                  overflow: visible !important;
                  margin: 0 !important;
                }
                .no-print {
                  display: none !important;
                }
                .print-area {
                  padding: 0 !important;
                  margin: 0 !important;
                  font-size: 11px !important;
                  line-height: 1.35 !important;
                }
                .print-card {
                  border: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  border-radius: 0 !important;
                  box-shadow: none !important;
                  page-break-inside: avoid;
                  page-break-after: avoid;
                }
                .print-card h2 {
                  font-size: 18px !important;
                  margin-bottom: 2px !important;
                }
                .print-card h3 {
                  font-size: 12.5px !important;
                  margin-bottom: 4px !important;
                  padding-bottom: 2px !important;
                }
                .print-card .print-section {
                  margin-bottom: 8px !important;
                  page-break-inside: avoid;
                }
                .print-card .write-line {
                  height: 12px !important;
                }
                .print-card .print-footer {
                  margin-top: 8px !important;
                  padding-top: 4px !important;
                  font-size: 10px !important;
                }
              }
            `}
          </style>
          <div className="print-portal fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-slate-200 no-print">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-800">심방 카드</h3>
                  <div className="flex space-x-2">
                    <Button onClick={handlePrint} className="flex items-center space-x-2">
                      <Printer className="h-4 w-4" />
                      <span>인쇄</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPrintModal(false)}
                    >
                      닫기
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="print-area p-6">
                <div className="print-card border border-slate-300 rounded-lg p-6 bg-white">
                  {/* 헤더 */}
                  <div className="print-section text-center mb-4">
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">심방 카드</h2>
                    <div className="text-sm text-slate-600">
                      발급일: {new Date().toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  {/* 성도 기본 정보 */}
                  <div className="print-section mb-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-2 border-b border-slate-200 pb-1">
                      성도 정보
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">이름:</span>
                        <span className="ml-2 text-slate-900">{selectedMember.name}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">연락처:</span>
                        <span className="ml-2 text-slate-900">{selectedMember.phone}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-slate-700">주소:</span>
                        <span className="ml-2 text-slate-900">{selectedMember.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* 가족 현황 */}
                  <div className="print-section mb-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-2 border-b border-slate-200 pb-1">
                      가족 현황
                    </h3>
                    {selectedMember.family.length > 0 ? (
                      <div className="space-y-1 text-sm">
                        {selectedMember.family.map((member: any, index: number) => (
                          <div key={index} className="flex items-center space-x-4">
                            <span className="font-medium text-slate-700">{member.relationship}:</span>
                            <span className="text-slate-900">{member.name}</span>
                            <span className="text-sm text-slate-600">({member.age}세)</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 text-sm">가족 정보가 등록되지 않았습니다.</p>
                    )}
                  </div>

                  {/* 심방 요청 정보 */}
                  <div className="print-section mb-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-2 border-b border-slate-200 pb-1">
                      이번 심방 정보
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">심방 유형:</span>
                        <span className="ml-2 text-slate-900">{getRequestTypeText(selectedRequest.requestType)}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">우선순위:</span>
                        <span className="ml-2 text-slate-900">{getPriorityText(selectedRequest.priority)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-slate-700">요청 내용:</span>
                        <p className="mt-1 text-slate-900 text-sm bg-slate-50 p-2 rounded">
                          {selectedRequest.requestContent}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 심방 기록 작성 공간 */}
                  <div className="print-section mb-4">
                    <h3 className="text-base font-semibold text-slate-800 mb-2 border-b border-slate-200 pb-1">
                      심방 기록
                    </h3>
                    <div className="border border-slate-200 rounded p-3">
                      <div className="text-sm text-slate-500 mb-1">심방일: _______________</div>
                      <div className="text-sm text-slate-500 mb-2">담당 목회자: _______________</div>
                      <div className="border-t border-slate-200 pt-2 mt-2">
                        <div className="text-sm text-slate-500 mb-2">심방 내용:</div>
                        <div className="space-y-2">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="write-line border-b border-slate-200 h-4"></div>
                          ))}
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-2 mt-3">
                        <div className="text-sm text-slate-500 mb-2">기도 제목:</div>
                        <div className="space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="write-line border-b border-slate-200 h-4"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 하단 정보 */}
                  <div className="print-footer print-section text-center text-xs text-slate-500 mt-4 pt-2 border-t border-slate-200">
                    <div>본 심방 카드는 목회 활동의 일환으로 작성되었습니다.</div>
                    <div className="mt-1">문의사항이 있으시면 교회로 연락주시기 바랍니다.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* 심방 완료 일지 작성 모달 */}
      {showCompletionModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedRequest.status === 'approved' ? '심방 기록 작성' : '심방 완료 일지 작성'}
              </h2>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm text-slate-600">신청자</p>
                  <p className="font-medium">{selectedRequest.requesterName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600">심방 유형</p>
                  <p className="font-medium">{getRequestTypeText(selectedRequest.requestType)}</p>
                </div>
                {selectedRequest.scheduledDate && selectedRequest.scheduledTime && (
                  <div>
                    <p className="text-sm text-slate-600">예정 일시</p>
                    <p className="font-medium">
                      {selectedRequest.scheduledDate} {selectedRequest.scheduledTime}
                    </p>
                  </div>
                )}
                {selectedRequest.status === 'approved' && (
                  <div>
                    <p className="text-sm text-slate-600">상태</p>
                    <p className="font-medium text-green-600">승인됨 - 기록 작성 가능</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-600">담당자</p>
                  <p className="font-medium">
                    {selectedRequest.assignedPastor?.name || '미배정'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  신청 내용
                </label>
                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md">
                  {selectedRequest.requestContent}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  심방 일지 <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  심방을 통해 확인한 내용, 기도 제목, 후속 조치 사항 등을 기록해주세요.
                </p>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="예:&#10;- 신청자 건강 상태: 수술 후 회복 중, 기력 회복됨&#10;- 가정 상황: 자녀 진학 문제로 고민 중&#10;- 기도 제목: 완전한 회복과 가정의 평안&#10;- 후속 조치: 2주 후 전화 안부 확인 예정&#10;- 기타: 교회 출석 재개 의지 확인함"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={8}
                />
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-md p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-primary-600 mt-0.5 mr-2" />
                  <div className="text-sm text-primary-800">
                    <p className="font-medium mb-1">심방 일지 작성 가이드</p>
                    <ul className="text-xs space-y-0.5">
                      <li>• 신청자의 현재 상황과 필요 사항을 구체적으로 기록</li>
                      <li>• 기도 제목과 관심사를 명확히 정리</li>
                      <li>• 후속 조치나 지속적인 관심이 필요한 부분 명시</li>
                      <li>• 개인정보 보호에 유의하여 작성</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
              <Button variant="outline" onClick={() => setShowCompletionModal(false)}>
                취소
              </Button>
              <Button
                onClick={handleSaveCompletion}
                disabled={!completionNotes.trim()}
                className="bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700"
                variant="outline"
              >
                심방 완료 처리
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 심방 기록 상세 모달 */}
      {showRecordDetailModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
          <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">심방 기록 상세</h2>
              <button 
                onClick={() => setShowRecordDetailModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">신청자</label>
                  <p className="text-slate-900">{selectedRecord.requesterName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">연락처</label>
                  <p className="text-slate-900">{selectedRecord.requesterPhone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">심방 유형</label>
                  <p className="text-slate-900">{getRequestTypeText(selectedRecord.requestType)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">우선순위</label>
                  <div className="flex items-center space-x-2">
                    <span className={cn("px-2 py-1 text-xs font-medium rounded", getPriorityColor(selectedRecord.priority))}>
                      {getPriorityText(selectedRecord.priority)}
                    </span>
                    {selectedRecord.isUrgent && (
                      <Badge className="bg-red-100 text-red-800 text-xs px-1 py-0">
                        <Zap className="h-3 w-3 mr-1" />
                        긴급
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">심방일</label>
                  <p className="text-slate-900">{selectedRecord.scheduledDate} {selectedRecord.scheduledTime}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">담당 목회자</label>
                  <p className="text-slate-900">{selectedRecord.assignedPastor?.name || '미지정'}</p>
                </div>
              </div>

              {/* 신청 내용 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">신청 내용</label>
                <div className="bg-slate-50 p-3 rounded-md">
                  <p className="text-slate-700 leading-relaxed">{selectedRecord.requestContent}</p>
                </div>
              </div>
              
              {/* 🆕 위치 정보 섹션 */}
              {(selectedRecord.address || selectedRecord.contactInfo) && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    위치 및 연락처 정보
                  </h4>
                  <div className="space-y-3">
                    {selectedRecord.address && (
                      <div className="bg-primary-50 border border-primary-200 rounded-md p-3">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-primary-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-primary-800 mb-1">방문 주소</p>
                            <p className="text-slate-900 leading-relaxed">{selectedRecord.address}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedRecord.contactInfo && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-start space-x-2">
                          <Phone className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800 mb-1">추가 연락처 정보</p>
                            <p className="text-slate-900 leading-relaxed">{selectedRecord.contactInfo}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 심방 일지 편집 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  심방 일지 <Edit className="inline h-4 w-4 ml-1" />
                </label>
                <textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  placeholder="심방을 통해 확인한 내용, 기도 제목, 후속 조치 사항 등을 기록해주세요."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={6}
                />
                <p className="text-xs text-slate-500 mt-1">
                  심방 내용을 수정하시려면 위 텍스트 영역을 편집하고 저장 버튼을 클릭하세요.
                </p>
              </div>

              {/* 메타 정보 */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">신청일</label>
                  <p className="text-sm text-slate-600">
                    {new Date(selectedRecord.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">완료일</label>
                  <p className="text-sm text-slate-600">
                    {selectedRecord.completedAt ? new Date(selectedRecord.completedAt).toLocaleDateString('ko-KR') : '미기록'}
                  </p>
                </div>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
              <Button variant="outline" onClick={() => setShowRecordDetailModal(false)}>
                취소
              </Button>
              <Button
                onClick={handleUpdateNotes}
              >
                <Edit className="h-4 w-4 mr-2" />
                일지 저장
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 관리자 직접 등록 모달 */}
      {showAdminRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
          <div className="bg-white rounded-lg w-full max-w-3xl shadow-xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">심방 신청 직접 등록</h2>
              <button 
                onClick={() => setShowAdminRegistrationModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    교인 선택 (선택사항)
                  </label>
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
                        console.log('👤 교인 선택:', {
                          id: selectedMember.id,
                          name: selectedMember.name,
                          church_id: selectedMember.church_id,
                          phone: selectedMember.phone
                        });
                        setNewRequest({
                          ...newRequest,
                          memberId: value,
                          requesterName: selectedMember.name,
                          requesterPhone: selectedMember.phone || '',
                          address: selectedMember.address || ''
                        });
                      } else {
                        console.log('👤 교인 선택 해제');
                        setNewRequest({
                          ...newRequest,
                          memberId: '',
                          requesterName: '',
                          requesterPhone: '',
                          address: ''
                        });
                      }
                    }}
                    placeholder="교인 검색 (이름, 전화번호) - 선택 안 하면 직접 입력"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      신청자명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newRequest.requesterName}
                      onChange={(e) => setNewRequest({...newRequest, requesterName: e.target.value})}
                      readOnly={!!newRequest.memberId}
                      className={cn(
                        "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                        newRequest.memberId && "bg-gray-50 text-gray-600"
                      )}
                      placeholder={newRequest.memberId ? "교인 선택 시 자동 입력" : "신청자 성명 직접 입력"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newRequest.requesterPhone}
                      onChange={(e) => setNewRequest({...newRequest, requesterPhone: e.target.value})}
                      readOnly={!!newRequest.memberId}
                      className={cn(
                        "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                        newRequest.memberId && "bg-gray-50 text-gray-600"
                      )}
                      placeholder={newRequest.memberId ? "교인 선택 시 자동 입력" : "010-0000-0000"}
                    />
                  </div>
                </div>
              </div>

              {/* 심방 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">심방 유형</label>
                  <Select
                    value={newRequest.requestType}
                    onValueChange={(value) => setNewRequest({...newRequest, requestType: value as 'general' | 'urgent' | 'hospital' | 'counseling'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">일반 심방</SelectItem>
                      <SelectItem value="urgent">긴급 심방</SelectItem>
                      <SelectItem value="hospital">병원 심방</SelectItem>
                      <SelectItem value="counseling">상담</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">우선순위</label>
                  <Select
                    value={newRequest.priority}
                    onValueChange={(value) => setNewRequest({...newRequest, priority: value as 'urgent' | 'high' | 'normal' | 'low'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="normal">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                      <SelectItem value="urgent">긴급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 신청 내용 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  신청 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newRequest.requestContent}
                  onChange={(e) => setNewRequest({...newRequest, requestContent: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="심방이 필요한 이유나 상황을 자세히 입력해주세요..."
                />
              </div>

              {/* 희망 일정 */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-3">희망 일정 (선택사항)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">희망 날짜</label>
                    <DatePicker
                      value={newRequest.preferredDate}
                      onChange={(value) => setNewRequest({...newRequest, preferredDate: value})}
                      placeholder="날짜 선택"
                      disablePast={true}
                      fromYear={2020}
                      toYear={new Date().getFullYear() + 5}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">희망 시간</label>
                    <div className="flex gap-2">
                      <Select
                        value={(() => {
                          const hour = parseInt(newRequest.preferredTimeStart.split(':')[0] || '0');
                          return hour >= 12 ? 'PM' : 'AM';
                        })()}
                        onValueChange={(period) => {
                          const currentHour = parseInt(newRequest.preferredTimeStart.split(':')[0] || '0');
                          const minute = newRequest.preferredTimeStart.split(':')[1] || '00';
                          let hour12 = currentHour % 12 || 12;
                          let newHour24 = period === 'PM' ? (hour12 === 12 ? 12 : hour12 + 12) : (hour12 === 12 ? 0 : hour12);
                          setNewRequest({...newRequest, preferredTimeStart: `${newHour24.toString().padStart(2, '0')}:${minute}`});
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="오전/오후" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">오전</SelectItem>
                          <SelectItem value="PM">오후</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={(() => {
                          const hour = parseInt(newRequest.preferredTimeStart.split(':')[0] || '0');
                          const hour12 = hour % 12 || 12;
                          return hour12.toString().padStart(2, '0');
                        })()}
                        onValueChange={(hour12) => {
                          const minute = newRequest.preferredTimeStart.split(':')[1] || '00';
                          const currentHour = parseInt(newRequest.preferredTimeStart.split(':')[0] || '0');
                          const isPM = currentHour >= 12;
                          const h12 = parseInt(hour12);
                          let newHour24 = isPM ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
                          setNewRequest({...newRequest, preferredTimeStart: `${newHour24.toString().padStart(2, '0')}:${minute}`});
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="시" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const hour = (i + 1).toString().padStart(2, '0');
                            return <SelectItem key={hour} value={hour}>{hour}시</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                      {newRequest.preferredTimeStart.split(':')[1] === 'custom' || customMinute ? (
                        <div className="flex-1 flex gap-1">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            value={customMinute}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                                setCustomMinute(value);
                                if (value !== '') {
                                  const hour = newRequest.preferredTimeStart.split(':')[0] || '00';
                                  setNewRequest({...newRequest, preferredTimeStart: `${hour}:${value.padStart(2, '0')}`});
                                }
                              }
                            }}
                            placeholder="분"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCustomMinute('');
                              const hour = newRequest.preferredTimeStart.split(':')[0] || '00';
                              setNewRequest({...newRequest, preferredTimeStart: `${hour}:00`});
                            }}
                            className="px-3"
                          >
                            ✕
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={newRequest.preferredTimeStart.split(':')[1] || ''}
                          onValueChange={(minute) => {
                            if (minute === 'custom') {
                              setCustomMinute('');
                              const hour = newRequest.preferredTimeStart.split(':')[0] || '00';
                              setNewRequest({...newRequest, preferredTimeStart: `${hour}:custom`});
                            } else {
                              const hour = newRequest.preferredTimeStart.split(':')[0] || '00';
                              setNewRequest({...newRequest, preferredTimeStart: `${hour}:${minute}`});
                            }
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="분" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="00">00분</SelectItem>
                            <SelectItem value="15">15분</SelectItem>
                            <SelectItem value="30">30분</SelectItem>
                            <SelectItem value="45">45분</SelectItem>
                            <SelectItem value="custom">직접 입력</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 위치 및 추가 정보 */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-3">위치 및 추가 정보 (선택사항)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">방문 주소</label>
                    <input
                      type="text"
                      value={newRequest.address}
                      onChange={(e) => setNewRequest({...newRequest, address: e.target.value})}
                      readOnly={!!newRequest.memberId}
                      className={cn(
                        "w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                        newRequest.memberId && "bg-gray-50 text-gray-600"
                      )}
                      placeholder={newRequest.memberId ? "교인 선택 시 자동 입력" : "예: 서울특별시 강남구 테헤란로 123"}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">추가 연락처 정보</label>
                    <input
                      type="text"
                      value={newRequest.contactInfo}
                      onChange={(e) => setNewRequest({...newRequest, contactInfo: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="예: 가족 연락처, 특이사항 등"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isUrgent"
                      checked={newRequest.isUrgent}
                      onChange={(e) => setNewRequest({...newRequest, isUrgent: e.target.checked})}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                    />
                    <label htmlFor="isUrgent" className="ml-2 block text-sm text-slate-900">
                      긴급 요청으로 표시
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 bg-slate-50">
              <Button variant="outline" onClick={() => setShowAdminRegistrationModal(false)}>
                취소
              </Button>
              <Button
                onClick={handleAdminRegistration}
              >
                <Plus className="h-4 w-4 mr-2" />
                등록하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default PastoralCareManagement;
