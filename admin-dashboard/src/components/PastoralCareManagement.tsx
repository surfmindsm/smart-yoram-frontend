import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from "./ui";
import { Input } from "./ui";
import { Card, CardContent } from "./ui";
import { Badge } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { Spinner } from "./ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Combobox } from "./ui";
import { SimpleTabs } from "./ui";
import { PageContainer, PageHeader } from "./ui";
import { DatePicker } from "./ui/date-picker";
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
  X
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

const PastoralCareManagement: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'requests' | 'records'>('requests');
  const [requests, setRequests] = useState<PastoralCareRequest[]>([]);
  const [completedRecords, setCompletedRecords] = useState<PastoralCareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [personFilter, setPersonFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
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

  // API에서 심방 신청 데이터 로드
  useEffect(() => {
    if (activeTab === 'requests') {
      loadPastoralCareRequests();
    } else {
      loadCompletedRecords();
    }
  }, [activeTab, statusFilter, priorityFilter, typeFilter]);
  
  // 초기 로드 시 모든 데이터 로드 (카운트 업데이트를 위해)
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadPastoralCareRequests(),
        loadCompletedRecords()
      ]);
    };
    loadAllData();
  }, []);

  const loadPastoralCareRequests = async () => {
    try {
      setLoading(true);

      // 현재 사용자의 church_id 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998; // 기본값 9998

      const params: any = {
        church_id: userChurchId,  // 현재 사용자의 교회 ID로 필터링
        exclude_completed: true   // 완료된 심방 제외
      };

      // exclude_completed가 true일 때는 status 필터를 적용하지 않음 (충돌 방지)
      // if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (typeFilter !== 'all') params.request_type = typeFilter;

      // 심방 신청과 교인 데이터를 병렬로 로드
      const [response, membersResult] = await Promise.allSettled([
        supabaseApiService.pastoralCare.getAll(params),
        supabaseApiService.members.getAll({ church_id: userChurchId })
      ]);

      // 교인 데이터 설정
      if (membersResult.status === 'fulfilled') {
        const membersData = membersResult.value?.data || membersResult.value || [];
        setMembers(membersData);
      } else {
        console.error('❌ 교인 데이터 로드 실패:', membersResult.reason);
        setMembers([]);
      }

      // 심방 신청 데이터 처리
      const finalResponse = response.status === 'fulfilled' ? response.value : { data: [] };

      // 백엔드 응답 구조 확인 및 데이터 추출
      let pastoralCareData = [];

      // 다양한 응답 구조에 대응
      if (Array.isArray(finalResponse)) {
        pastoralCareData = finalResponse;
      } else if (finalResponse && Array.isArray(finalResponse.data)) {
        pastoralCareData = finalResponse.data;
      } else if (finalResponse && Array.isArray((finalResponse as any).items)) {
        pastoralCareData = (finalResponse as any).items;
      } else if (finalResponse && Array.isArray((finalResponse as any).results)) {
        pastoralCareData = (finalResponse as any).results;
      } else {
        pastoralCareData = [];
      }

      // 백엔드 응답 데이터를 프론트엔드 인터페이스에 맞게 변환
      const transformedRequests: PastoralCareRequest[] = pastoralCareData.map((item: any) => ({
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
        // 🆕 새로 추가된 위치 관련 필드들
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        contactInfo: item.contact_info,
        isUrgent: item.is_urgent || false,
        distanceKm: item.distance_km  // 위치 검색 결과에서만 사용
      }));

      setRequests(transformedRequests);
    } catch (error) {
      console.error('Failed to load pastoral care requests:', error);
      // 에러 발생 시 빈 배열로 설정
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedRecords = async () => {
    try {
      setLoading(true);

      // 현재 사용자의 church_id 가져오기
      const currentUser = await supabaseAuthService.getCurrentUser();
      const userChurchId = currentUser?.user?.church_id || 9998; // 기본값 9998

      const params: any = {
        church_id: userChurchId,  // 현재 사용자의 교회 ID로 필터링
        status: 'completed' // 완료된 심방 기록만 조회
      };

      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (typeFilter !== 'all') params.request_type = typeFilter;
      
      const response = await supabaseApiService.pastoralCare.getAll(params);
      
      let recordsData = [];
      
      if (Array.isArray(response)) {
        recordsData = response;
      } else if (response && Array.isArray(response.data)) {
        recordsData = response.data;
      } else if (response && Array.isArray((response as any).items)) {
        recordsData = (response as any).items;
      } else if (response && Array.isArray((response as any).results)) {
        recordsData = (response as any).results;
      } else {
        console.warn('Unexpected response structure:', response);
        recordsData = [];
      }
      
      const transformedRecords: PastoralCareRecord[] = recordsData.map((item: any) => {
        // assigned_pastor_id로 담당자 정보 찾기 (백엔드에서 조인된 데이터 사용)
        let assignedPastor = undefined;
        if (item.assigned_pastor_id && item.assigned_pastor?.name) {
          assignedPastor = {
            id: item.assigned_pastor_id,
            name: item.assigned_pastor.name,
            phone: item.assigned_pastor.phone || ''
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
          // 🆕 위치 관련 필드 추가
          address: item.address,
          latitude: item.latitude,
          longitude: item.longitude,
          contactInfo: item.contact_info,
          isUrgent: item.is_urgent || false
        };
      });
      
      setCompletedRecords(transformedRecords);
    } catch (error) {
      console.error('Failed to load completed pastoral care records:', error);
      setCompletedRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-primary-100 text-primary-800';
      case 'scheduled': return 'bg-primary-100 text-primary-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'approved': return '승인됨';
      case 'scheduled': return '예정됨';
      case 'completed': return '완료';
      case 'cancelled': return '취소';
      default: return '알 수 없음';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-gray-600';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-600';
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
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || request.requestType === typeFilter;
    // 🆕 긴급 요청 필터
    const matchesUrgent = urgentFilter === 'all' || 
                         (urgentFilter === 'urgent' && request.isUrgent) ||
                         (urgentFilter === 'normal' && !request.isUrgent);
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesUrgent;
  });

  const filteredRecords = completedRecords.filter(record => {
    const matchesSearch = 
      record.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.requestContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.completionNotes && record.completionNotes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPriority = priorityFilter === 'all' || record.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || record.requestType === typeFilter;
    
    // 사람별 필터
    const matchesPerson = !personFilter || record.requesterName.toLowerCase().includes(personFilter.toLowerCase());
    
    // 날짜 필터
    const recordDate = record.completedAt ? new Date(record.completedAt) : new Date();
    const matchesDateFrom = !dateFromFilter || recordDate >= new Date(dateFromFilter);
    const matchesDateTo = !dateToFilter || recordDate <= new Date(dateToFilter + 'T23:59:59');
    
    return matchesSearch && matchesPriority && matchesType && matchesPerson && matchesDateFrom && matchesDateTo;
  });

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
    try {
      await supabaseApiService.pastoralCare.update(request.id, {
        status: 'approved',
        admin_notes: '승인됨'
      });
      
      setRequests(prev => 
        prev.map(req => 
          req.id === request.id 
            ? { ...req, status: 'approved' as const, adminNotes: '승인됨' }
            : req
        )
      );
    } catch (error) {
      console.error('Failed to approve request:', error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="심방 관리"
        description="심방 신청 관리와 완료된 심방 기록을 확인하세요"
        actions={
          <>
            <Button
              onClick={() => setShowAdminRegistrationModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              직접 등록
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>필터</span>
            </Button>
          </>
        }
      />

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

      {/* 신청 관리 탭 */}
      {activeTab === 'requests' && (
        <>
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card className="border-muted">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-yellow-500/10">
                    <Clock className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">대기중</p>
                    <div className="text-2xl font-bold text-foreground">
                      {requests.filter(r => r.status === 'pending').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 🆕 긴급 요청 통계 추가 */}
            <Card className="border-muted">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <Zap className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">긴급 요청</p>
                    <div className="text-2xl font-bold text-foreground">
                      {requests.filter(r => r.isUrgent).length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-primary-500/10">
                    <Calendar className="h-6 w-6 text-primary-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">예정됨</p>
                    <div className="text-2xl font-bold text-foreground">
                      {requests.filter(r => r.status === 'scheduled').length}
                    </div>
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
                    <p className="text-sm font-medium text-muted-foreground">완료</p>
                    <div className="text-2xl font-bold text-foreground">
                      {requests.filter(r => r.status === 'completed').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-slate-500/10">
                    <Users className="h-6 w-6 text-slate-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">전체</p>
                    <div className="text-2xl font-bold text-foreground">{requests.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* 심방 기록 탭 */}
      {activeTab === 'records' && (
        <>
          {/* 심방 기록 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-muted">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">총 심방 완료</p>
                    <div className="text-2xl font-bold text-foreground">
                      {completedRecords.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-primary-500/10">
                    <Calendar className="h-6 w-6 text-primary-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">이번 달</p>
                    <div className="text-2xl font-bold text-foreground">
                      {completedRecords.filter(r => {
                        const completedAt = new Date(r.completedAt || r.createdAt);
                        const thisMonth = new Date();
                        return completedAt.getMonth() === thisMonth.getMonth() &&
                               completedAt.getFullYear() === thisMonth.getFullYear();
                      }).length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-red-500/10">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">병원 심방</p>
                    <div className="text-2xl font-bold text-foreground">
                      {completedRecords.filter(r => r.requestType === 'hospital').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-primary-500/10">
                    <FileText className="h-6 w-6 text-primary-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">일지 작성</p>
                    <div className="text-2xl font-bold text-foreground">
                      {completedRecords.filter(r => r.completionNotes && r.completionNotes.trim()).length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* 검색 및 필터 */}
      <Card className="border-muted">
        <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="신청자 이름 또는 내용으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {/* 🆕 위치 기반 검색 섽션 - 주석처리 */}
            {/* <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-primary-800 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  위치 기반 검색
                </h4>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="text-primary-600 border-primary-300 hover:bg-primary-100"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    현재 위치
                  </Button>
                  <Button
                    size="sm"
                    onClick={loadLocationBasedRequests}
                  >
                    <Target className="h-3 w-3 mr-1" />
                    검색
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-primary-700 mb-1">위도</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={searchLocation.latitude}
                    onChange={(e) => setSearchLocation({...searchLocation, latitude: parseFloat(e.target.value) || 0})}
                    className="w-full px-2 py-1 text-sm border border-primary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="37.5665"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary-700 mb-1">경도</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={searchLocation.longitude}
                    onChange={(e) => setSearchLocation({...searchLocation, longitude: parseFloat(e.target.value) || 0})}
                    className="w-full px-2 py-1 text-sm border border-primary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="126.9780"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary-700 mb-1">반경 (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={searchLocation.radius_km}
                    onChange={(e) => setSearchLocation({...searchLocation, radius_km: parseFloat(e.target.value) || 5.0})}
                    className="w-full px-2 py-1 text-sm border border-primary-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="5.0"
                  />
                </div>
              </div>
              
              {locationSearchResults.length > 0 && (
                <div className="mt-3 text-xs text-primary-700">
                  검색 결과: {locationSearchResults.length}건 (거리순 정렬)
                </div>
              )}
            </div> */}
            
            {/* 🆕 빠른 액션 버튼들 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-3">빠른 액션</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadUrgentRequests}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  긴급 요청만 보기
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadRequestsWithLocation}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  위치 정보 있는 요청
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadPastoralCareRequests}
                  className="text-primary-600 border-primary-300 hover:bg-primary-50"
                >
                  <User className="h-3 w-3 mr-1" />
                  전체 요청 다시 로드
                </Button>
              </div>
            </div>
            
            {/* 기존 필터들 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">상태</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">전체</option>
                <option value="pending">대기중</option>
                <option value="approved">승인됨</option>
                <option value="scheduled">예정됨</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">우선순위</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">전체</option>
                <option value="urgent">긴급</option>
                <option value="high">높음</option>
                <option value="normal">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">유형</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">전체</option>
                <option value="general">일반 심방</option>
                <option value="urgent">긴급 심방</option>
                <option value="hospital">병원 심방</option>
                <option value="counseling">상담</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">긴급 여부</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                value={urgentFilter}
                onChange={(e) => setUrgentFilter(e.target.value)}
              >
                <option value="all">전체</option>
                <option value="urgent">긴급 요청</option>
                <option value="normal">일반 요청</option>
              </select>
            </div>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* 신청 관리 목록 */}
      {activeTab === 'requests' && (
        <Card className="border-muted overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  신청자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  조직
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  부서
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  우선순위
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  신청일
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredRequests.map((request) => (
                <tr 
                  key={request.id} 
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => handleViewDetails(request)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {request.profilePhotoUrl ? (
                        <img
                          src={request.profilePhotoUrl}
                          alt={request.requesterName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="h-6 w-6 text-slate-400" />
                        </div>
                      )}
                      <div className="ml-3">
                        <div className="text-sm font-medium text-slate-900">
                          {request.requesterName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {request.organizationName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {request.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-900">
                        {getRequestTypeText(request.requestType)}
                      </span>
                      {/* 🆕 긴급 요청 표시 */}
                      {request.isUrgent && (
                        <Badge className="bg-red-100 text-red-800 text-xs px-1 py-0">
                          <Zap className="h-3 w-3 mr-1" />
                          긴급
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn("text-sm font-medium", getPriorityColor(request.priority))}>
                      {getPriorityText(request.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                      getStatusColor(request.status)
                    )}>
                      {getStatusText(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.assignedPastor ? (
                      <div className="text-sm text-slate-900">
                        {request.assignedPastor.name}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">미배정</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(request.createdAt).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex items-center justify-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      {request.status === 'pending' && !request.assignedPastor && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignPastor(request);
                          }}
                          className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          담당자 배정
                        </button>
                      )}
                      {request.status === 'pending' && request.assignedPastor && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApprove(request);
                            }}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            승인
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReject(request);
                            }}
                            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            반려
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSchedule(request);
                            }}
                            className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            일정변경
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignPastor(request);
                            }}
                            className="px-3 py-1.5 bg-slate-500 hover:bg-slate-600 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            재배정
                          </button>
                        </>
                      )}
                      {(request.status === 'approved' || request.status === 'scheduled' || request.status === 'in_progress') && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                              setShowCompletionModal(true);
                            }}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            완료처리
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAssignPastor(request);
                            }}
                            className="px-3 py-1.5 bg-slate-500 hover:bg-slate-600 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            재배정
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintCard(request);
                            }}
                            className="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            카드인쇄
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-500">조건에 맞는 심방 신청이 없습니다.</p>
          </div>
        )}
        </Card>
      )}

      {/* 심방 기록 목록 */}
      {activeTab === 'records' && (
        <>
          {/* 심방 기록 필터링 */}
          <Card className="border-muted mb-6">
            <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">심방 기록 검색 및 필터</h3>
              <button
                onClick={() => {
                  setPersonFilter('');
                  setDateFromFilter('');
                  setDateToFilter('');
                  setSearchTerm('');
                  setPriorityFilter('all');
                  setTypeFilter('all');
                }}
                className="text-sm text-slate-600 hover:text-slate-800"
              >
                필터 초기화
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 사람별 검색 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  성명 검색
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="성명으로 검색..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={personFilter}
                    onChange={(e) => setPersonFilter(e.target.value)}
                  />
                </div>
              </div>

              {/* 기간 필터 - 시작일 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  시작일
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>

              {/* 기간 필터 - 종료일 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  종료일
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>

              {/* 우선순위 필터 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  우선순위
                </label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">전체</option>
                  <option value="high">긴급</option>
                  <option value="medium">보통</option>
                  <option value="low">일반</option>
                </select>
              </div>
            </div>

            {/* 검색 결과 통계 */}
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>총 {filteredRecords.length}건의 심방 기록</span>
              {(personFilter || dateFromFilter || dateToFilter || priorityFilter !== 'all' || typeFilter !== 'all') && (
                <span className="text-primary-600">필터 적용 중</span>
              )}
            </div>
            </CardContent>
          </Card>

          {/* 테이블 형태로 변경 */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      신청자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      조직
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      부서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      심방 유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      우선순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      심방일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      담당자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      완료일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      일지
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <FileText className="h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-lg font-medium">심방 기록이 없습니다</p>
                          <p className="text-sm text-gray-400 mt-1">완료된 심방이 없거나 필터 조건에 맞는 기록이 없습니다.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {record.profilePhotoUrl ? (
                              <img
                                src={record.profilePhotoUrl}
                                alt={record.requesterName}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{record.requesterName}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.organizationName || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {record.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <span className="text-sm text-gray-900">{getRequestTypeText(record.requestType)}</span>
                            {(record as any).isUrgent && (
                              <Badge className="bg-red-100 text-red-800 text-xs">
                                <Zap className="h-3 w-3 mr-1" />
                                긴급
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn("text-sm font-medium", getPriorityColor(record.priority))}>
                            {getPriorityText(record.priority)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 text-gray-400 mr-1" />
                            {record.scheduledDate} {record.scheduledTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.assignedPastor?.name || '미지정'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                            {record.completedAt ? new Date(record.completedAt).toLocaleDateString('ko-KR') : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {record.completionNotes ? (
                            <Badge className="bg-green-100 text-green-800">
                              <FileText className="h-3 w-3 mr-1" />
                              작성완료
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              미작성
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRecordDetail(record)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            상세보기
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* 상세 보기 모달 */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">심방 신청 상세</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">신청자 정보</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">이름:</span> {selectedRequest.requesterName}</p>
                    <p><span className="font-medium">전화번호:</span> {selectedRequest.requesterPhone}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">신청 정보</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">유형:</span> {getRequestTypeText(selectedRequest.requestType)}</p>
                    <p><span className="font-medium">우선순위:</span> {getPriorityText(selectedRequest.priority)}</p>
                    <p><span className="font-medium">상태:</span> {getStatusText(selectedRequest.status)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">신청 내용</h3>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-md">
                  {selectedRequest.requestContent}
                </p>
              </div>

              {selectedRequest.preferredDate && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">희망 일정</h3>
                  <p><span className="font-medium">날짜:</span> {selectedRequest.preferredDate}</p>
                  {selectedRequest.preferredTimeStart && selectedRequest.preferredTimeEnd && (
                    <p><span className="font-medium">시간:</span> {selectedRequest.preferredTimeStart} - {selectedRequest.preferredTimeEnd}</p>
                  )}
                </div>
              )}

              {/* 🆕 위치 정보 섹션 개선 */}
              {(selectedRequest.address || selectedRequest.contactInfo || selectedRequest.isUrgent) && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-primary-800 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    위치 및 추가 정보
                  </h3>
                  <div className="space-y-4">
                    {selectedRequest.address && (
                      <div className="bg-white rounded-md p-3">
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-5 w-5 text-primary-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-primary-800 mb-1">방문 주소</p>
                            <p className="text-slate-900 text-base leading-relaxed">{selectedRequest.address}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {selectedRequest.contactInfo && (
                      <div className="bg-white rounded-md p-3">
                        <div className="flex items-start space-x-3">
                          <Phone className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800 mb-1">추가 연락처 정보</p>
                            <p className="text-slate-900 text-base leading-relaxed">{selectedRequest.contactInfo}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.isUrgent && (
                        <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
                          <Zap className="h-4 w-4" />
                          <span className="text-sm font-medium">긴급 요청</span>
                        </div>
                      )}
                      {selectedRequest.distanceKm && (
                        <div className="flex items-center space-x-2 bg-primary-100 text-primary-800 px-3 py-1 rounded-full">
                          <Target className="h-4 w-4" />
                          <span className="text-sm font-medium">거리: {formatDistance(selectedRequest.distanceKm)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedRequest.assignedPastor && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">담당 목사</h3>
                  <p><span className="font-medium">이름:</span> {selectedRequest.assignedPastor.name}</p>
                  <p><span className="font-medium">전화번호:</span> {selectedRequest.assignedPastor.phone}</p>
                </div>
              )}

              {selectedRequest.rejectionReason && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">거부 사유</h3>
                  <p className="text-slate-900 bg-red-50 p-3 rounded-md border border-red-200">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}

              {selectedRequest.completionNotes && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">완료 노트</h3>
                  <p className="text-slate-900 bg-green-50 p-3 rounded-md">
                    {selectedRequest.completionNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

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

      {/* 심방 카드 인쇄 모달 */}
      {showPrintModal && selectedMember && selectedRequest && (
        <>
          <style>
            {`
              @media print {
                body * {
                  visibility: hidden;
                }
                .print-area, .print-area * {
                  visibility: visible;
                }
                .print-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}
          </style>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
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
                <div className="border border-slate-300 rounded-lg p-6 bg-white">
                  {/* 헤더 */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">심방 카드</h2>
                    <div className="text-sm text-slate-600">
                      발급일: {new Date().toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  {/* 성도 기본 정보 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-1">
                      성도 정보
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
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
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-1">
                      가족 현황
                    </h3>
                    {selectedMember.family.length > 0 ? (
                      <div className="space-y-2">
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
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-1">
                      이번 심방 정보
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-slate-700">심방 유형:</span>
                        <span className="ml-2 text-slate-900">{selectedRequest.requestType}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">우선순위:</span>
                        <span className="ml-2 text-slate-900">{getPriorityText(selectedRequest.priority)}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium text-slate-700">요청 내용:</span>
                        <p className="mt-1 text-slate-900 text-sm bg-slate-50 p-3 rounded">
                          {selectedRequest.requestContent}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 심방 기록 작성 공간 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b border-slate-200 pb-1">
                      심방 기록
                    </h3>
                    <div className="border border-slate-200 rounded p-4 min-h-[120px]">
                      <div className="text-sm text-slate-500 mb-2">심방일: _______________</div>
                      <div className="text-sm text-slate-500 mb-2">담당 목회자: _______________</div>
                      <div className="border-t border-slate-200 pt-2 mt-4">
                        <div className="text-sm text-slate-500 mb-2">심방 내용:</div>
                        <div className="space-y-3">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="border-b border-slate-200 h-4"></div>
                          ))}
                        </div>
                      </div>
                      <div className="border-t border-slate-200 pt-2 mt-4">
                        <div className="text-sm text-slate-500 mb-2">기도 제목:</div>
                        <div className="space-y-3">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="border-b border-slate-200 h-4"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 하단 정보 */}
                  <div className="text-center text-xs text-slate-500 mt-8 pt-4 border-t border-slate-200">
                    <div>본 심방 카드는 목회 활동의 일환으로 작성되었습니다.</div>
                    <div className="mt-1">문의사항이 있으시면 교회로 연락주시기 바랍니다.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
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
                    options={members.map(member => {
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
                  <select
                    value={newRequest.requestType}
                    onChange={(e) => setNewRequest({...newRequest, requestType: e.target.value as 'general' | 'urgent' | 'hospital' | 'counseling'})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="general">일반 심방</option>
                    <option value="urgent">긴급 심방</option>
                    <option value="hospital">병원 심방</option>
                    <option value="counseling">상담</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">우선순위</label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({...newRequest, priority: e.target.value as 'urgent' | 'high' | 'normal' | 'low'})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="low">낮음</option>
                    <option value="normal">보통</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
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
