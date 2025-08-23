import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Combobox } from './ui/combobox';
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
  Info
} from 'lucide-react';
import { cn } from '../lib/utils';
import { pastoralCareService } from '../services/api';

interface PastoralCareRequest {
  id: string;
  churchId: number;
  memberId?: number;
  requesterName: string;
  requesterPhone: string;
  requestType: 'general' | 'urgent' | 'hospital' | 'counseling';
  requestContent: string;
  preferredDate?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  status: 'pending' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  assignedPastorId?: number;
  assignedPastor?: {
    id: number;
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
  requestType: 'general' | 'urgent' | 'hospital' | 'counseling';
  requestContent: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  scheduledDate: string;
  scheduledTime: string;
  assignedPastor?: {
    id: number;
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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showRecordDetailModal, setShowRecordDetailModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
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
  const [assignedPastorId, setAssignedPastorId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  
  // 🆕 관리자 직접 등록 모달 상태
  const [showAdminRegistrationModal, setShowAdminRegistrationModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    requesterName: '',
    requesterPhone: '',
    requestType: 'general' as 'general' | 'urgent' | 'hospital' | 'counseling',
    requestContent: '',
    preferredDate: '',
    preferredTimeStart: '',
    preferredTimeEnd: '',
    priority: 'normal' as 'urgent' | 'high' | 'normal' | 'low',
    address: '',
    contactInfo: '',
    isUrgent: false
  });

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
      const params: any = {};
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (typeFilter !== 'all') params.request_type = typeFilter;
      
      const response = await pastoralCareService.getRequests(params);
      
      // 백엔드 응답 구조 확인 및 데이터 추출
      
      let pastoralCareData = [];
      
      // 다양한 응답 구조에 대응
      if (Array.isArray(response)) {
        pastoralCareData = response;
      } else if (response && Array.isArray(response.data)) {
        pastoralCareData = response.data;
      } else if (response && Array.isArray(response.items)) {
        pastoralCareData = response.items;
      } else if (response && Array.isArray(response.results)) {
        pastoralCareData = response.results;
      } else {
        console.warn('Unexpected response structure:', response);
        pastoralCareData = [];
      }
      
      // 백엔드 응답 데이터를 프론트엔드 인터페이스에 맞게 변환
      const transformedRequests: PastoralCareRequest[] = pastoralCareData.map((item: any) => ({
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
      const params: any = {
        status: 'completed' // 완료된 심방 기록만 조회
      };
      
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (typeFilter !== 'all') params.request_type = typeFilter;
      
      const response = await pastoralCareService.getRequests(params);
      
      let recordsData = [];
      
      if (Array.isArray(response)) {
        recordsData = response;
      } else if (response && Array.isArray(response.data)) {
        recordsData = response.data;
      } else if (response && Array.isArray(response.items)) {
        recordsData = response.items;
      } else if (response && Array.isArray(response.results)) {
        recordsData = response.results;
      } else {
        console.warn('Unexpected response structure:', response);
        recordsData = [];
      }
      
      const transformedRecords: PastoralCareRecord[] = recordsData.map((item: any) => ({
        id: item.id,
        requesterName: item.requester_name,
        requesterPhone: item.requester_phone,
        requestType: item.request_type,
        requestContent: item.request_content,
        priority: item.priority || 'normal',
        assignedPastor: item.assigned_pastor_id ? {
          id: item.assigned_pastor_id,
          name: item.assigned_pastor?.name || '담당자 미지정',
          phone: item.assigned_pastor?.phone || ''
        } : undefined,
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
      }));
      
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
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
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
      
      // 위치 기반 검색 API 호출 (가상의 API - 실제로는 pastoralCareService에 추가 필요)
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
      await pastoralCareService.updateRequest(request.id, {
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
      await pastoralCareService.updateRequest(selectedRequest.id, {
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

  const handleAssignPastor = (request: PastoralCareRequest) => {
    setSelectedRequest(request);
    setAssignedPastorId('');
    setShowAssignModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedRequest || !scheduledDate || !scheduledTime) return;

    try {
      await pastoralCareService.updateRequest(selectedRequest.id, {
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
    } catch (error) {
      console.error('Failed to schedule request:', error);
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
    const updateData = {
      status: 'completed',
      completion_notes: completionNotes,
      completed_at: new Date().toISOString()
    };

    try {
      // 심방 신청을 완료 상태로 업데이트 - completeRequest 엔드포인트 사용
      const response = await pastoralCareService.completeRequest(selectedRequest.id, {
        completion_notes: completionNotes,
        completed_at: new Date().toISOString()
      });

      // 완료된 심방을 기록 목록에 추가
      const completedRecord: PastoralCareRecord = {
        id: selectedRequest.id,
        requesterName: selectedRequest.requesterName,
        requesterPhone: selectedRequest.requesterPhone,
        requestType: selectedRequest.requestType,
        requestContent: selectedRequest.requestContent,
        priority: selectedRequest.priority,
        scheduledDate: selectedRequest.scheduledDate || new Date().toISOString().split('T')[0],
        scheduledTime: selectedRequest.scheduledTime || '미지정',
        assignedPastor: selectedRequest.assignedPastor,
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

      const requestData = {
        requester_name: newRequest.requesterName,
        requester_phone: newRequest.requesterPhone,
        request_type: newRequest.requestType,
        request_content: newRequest.requestContent,
        preferred_date: newRequest.preferredDate || null,
        preferred_time_start: newRequest.preferredTimeStart || null,
        preferred_time_end: newRequest.preferredTimeEnd || null,
        priority: newRequest.priority,
        address: newRequest.address || null,
        contact_info: newRequest.contactInfo || null,
        is_urgent: newRequest.isUrgent,
        status: 'pending' // 관리자 등록이므로 대기 상태로 시작
      };

      await pastoralCareService.createRequest(requestData);
      
      // 등록 성공 후 목록 새로고침
      await loadPastoralCareRequests();
      
      // 폼 초기화
      setNewRequest({
        requesterName: '',
        requesterPhone: '',
        requestType: 'general',
        requestContent: '',
        preferredDate: '',
        preferredTimeStart: '',
        preferredTimeEnd: '',
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
      const response = await pastoralCareService.completeRequest(selectedRecord.id, updateData);
      const updatedRecord = await pastoralCareService.getRequest(selectedRecord.id);

      // 로컬 상태 업데이트
      setCompletedRecords(prev => prev.map(record => 
        record.id === selectedRecord.id 
          ? { ...record, completionNotes: editingNotes }
          : record
      ));
      
      // 선택된 기록 업데이트
      setSelectedRecord(prev => prev ? { ...prev, completionNotes: editingNotes } : null);

      setShowRecordDetailModal(false);
      
      if (updatedRecord.completion_notes === editingNotes) {
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

  const handleSaveAssignment = async () => {
    if (!selectedRequest || !assignedPastorId) return;

    try {
      await pastoralCareService.assignPastor(selectedRequest.id, assignedPastorId);
      
      setRequests(prev => 
        prev.map(req => 
          req.id === selectedRequest.id 
            ? { 
                ...req, 
                assignedPastorId: parseInt(assignedPastorId),
                assignedPastor: {
                  id: parseInt(assignedPastorId),
                  name: '배정된 목사',
                  phone: ''
                }
              }
            : req
        )
      );
      
      setShowAssignModal(false);
      setAssignedPastorId('');
    } catch (error) {
      console.error('Failed to assign pastor:', error);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">심방 관리</h1>
          <p className="text-slate-600 mt-1">심방 신청 관리와 완료된 심방 기록을 확인하세요</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowAdminRegistrationModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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
        </div>
      </div>

      {/* 탭 네비게이션 좌측 정렬로 변경 */}
      <div className="bg-white rounded-lg border border-slate-200 p-1 mb-6 inline-flex">
          <button
            onClick={() => setActiveTab('requests')}
            className={cn(
              "py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center space-x-2",
              activeTab === 'requests'
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Users className="h-4 w-4" />
            <span>심방 신청</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium ml-1",
              activeTab === 'requests' 
                ? "bg-blue-500 text-white" 
                : "bg-slate-200 text-slate-600"
            )}>
              {requests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={cn(
              "py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center space-x-2",
              activeTab === 'records'
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <FileText className="h-4 w-4" />
            <span>심방 기록</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium ml-1",
              activeTab === 'records' 
                ? "bg-blue-500 text-white" 
                : "bg-slate-200 text-slate-600"
            )}>
              {completedRecords.length}
            </span>
          </button>
      </div>

      {/* 신청 관리 탭 */}
      {activeTab === 'requests' && (
        <>
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">대기중</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            
            {/* 🆕 긴급 요청 통계 추가 */}
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">긴급 요청</p>
                  <p className="text-2xl font-bold text-red-600">
                    {requests.filter(r => r.isUrgent).length}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">예정됨</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {requests.filter(r => r.status === 'scheduled').length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">완료</p>
                  <p className="text-2xl font-bold text-green-600">
                    {requests.filter(r => r.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">전체</p>
                  <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
                </div>
                <Users className="h-8 w-8 text-slate-600" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* 심방 기록 탭 */}
      {activeTab === 'records' && (
        <>
          {/* 심방 기록 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">총 심방 완료</p>
                  <p className="text-2xl font-bold text-green-600">
                    {completedRecords.length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">이번 달</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {completedRecords.filter(r => {
                      const completedAt = new Date(r.completedAt || r.createdAt);
                      const thisMonth = new Date();
                      return completedAt.getMonth() === thisMonth.getMonth() && 
                             completedAt.getFullYear() === thisMonth.getFullYear();
                    }).length}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">병원 심방</p>
                  <p className="text-2xl font-bold text-red-600">
                    {completedRecords.filter(r => r.requestType === 'hospital').length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">일지 작성</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {completedRecords.filter(r => r.completionNotes && r.completionNotes.trim()).length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </>
      )}

      {/* 검색 및 필터 */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="신청자 이름 또는 내용으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {/* 🆕 위치 기반 검색 섽션 - 주석처리 */}
            {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-blue-800 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  위치 기반 검색
                </h4>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    현재 위치
                  </Button>
                  <Button
                    size="sm"
                    onClick={loadLocationBasedRequests}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Target className="h-3 w-3 mr-1" />
                    검색
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">위도</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={searchLocation.latitude}
                    onChange={(e) => setSearchLocation({...searchLocation, latitude: parseFloat(e.target.value) || 0})}
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="37.5665"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">경도</label>
                  <input
                    type="number"
                    step="0.0000001"
                    value={searchLocation.longitude}
                    onChange={(e) => setSearchLocation({...searchLocation, longitude: parseFloat(e.target.value) || 0})}
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="126.9780"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-blue-700 mb-1">반경 (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={searchLocation.radius_km}
                    onChange={(e) => setSearchLocation({...searchLocation, radius_km: parseFloat(e.target.value) || 5.0})}
                    className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5.0"
                  />
                </div>
              </div>
              
              {locationSearchResults.length > 0 && (
                <div className="mt-3 text-xs text-blue-700">
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
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
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
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
      </div>

      {/* 신청 관리 목록 */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  신청자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  우선순위
                </th>
                {/* 🆕 위치 정보 열 추가 */}
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    위치/거리
                  </div>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                      <User className="h-8 w-8 bg-slate-100 rounded-full p-1.5 text-slate-600" />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-slate-900">
                          {request.requesterName}
                        </div>
                        <div className="text-sm text-slate-500 flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {request.requesterPhone}
                        </div>
                      </div>
                    </div>
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
                  {/* 🆕 위치 정보 열 */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {request.address ? (
                        <>
                          <div className="flex items-center text-sm text-slate-900">
                            <MapPin className="h-3 w-3 mr-1 text-slate-400" />
                            <span className="truncate max-w-[120px]" title={request.address}>
                              {request.address}
                            </span>
                          </div>
                          {request.distanceKm && (
                            <div className="text-xs text-blue-600 font-medium">
                              {formatDistance(request.distanceKm)} 거리
                            </div>
                          )}
                          {request.contactInfo && (
                            <div className="text-xs text-slate-500 flex items-center" title={request.contactInfo}>
                              <Info className="h-3 w-3 mr-1" />
                              추가연락처
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">위치 미등록</span>
                      )}
                    </div>
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
                    {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                      {request.status === 'pending' && (
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
                            거부
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSchedule(request);
                            }}
                            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            일정조율
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && !request.assignedPastor && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignPastor(request);
                          }}
                          className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          담당자배정
                        </button>
                      )}
                      {(request.status === 'approved' || request.status === 'scheduled' || request.status === 'in_progress') && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRequest(request);
                              setShowCompletionModal(true);
                            }}
                            className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            완료처리
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintCard(request);
                            }}
                            className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
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
        </div>
      )}

      {/* 심방 기록 목록 */}
      {activeTab === 'records' && (
        <>
          {/* 심방 기록 필터링 */}
          <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
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
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                <span className="text-blue-600">필터 적용 중</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {filteredRecords.map((record) => (
              <div key={record.id} 
                   className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                   onClick={() => handleRecordDetail(record)}
                   >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-slate-600" />
                        <span className="font-medium text-slate-900">{record.requesterName}</span>
                      </div>
                      <span className={cn("text-sm font-medium", getPriorityColor(record.priority))}>
                        {getPriorityText(record.priority)}
                      </span>
                      <span className="text-sm text-slate-600">
                        {getRequestTypeText(record.requestType)}
                      </span>
                      {/* 🆕 긴급 요청 표시 */}
                      {(record as any).isUrgent && (
                        <Badge className="bg-red-100 text-red-800 text-xs px-1 py-0">
                          <Zap className="h-3 w-3 mr-1" />
                          긴급
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-slate-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>심방일: {record.scheduledDate} {record.scheduledTime}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>담당: {record.assignedPastor?.name || '미지정'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>완료: {record.completedAt ? new Date(record.completedAt).toLocaleDateString('ko-KR') : '날짜 미기록'}</span>
                      </div>
                    </div>

                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                      <span className="font-medium">신청 내용:</span> {record.requestContent}
                    </p>
                    
                    {/* 🆕 위치 정보 확장 표시 */}
                    {((record as any).address || (record as any).contactInfo) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                        <div className="space-y-2">
                          {(record as any).address && (
                            <div className="flex items-start space-x-2 text-sm">
                              <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-blue-800">방문 주소:</span>
                                <p className="text-blue-700 mt-1">{(record as any).address}</p>
                              </div>
                            </div>
                          )}
                          {(record as any).contactInfo && (
                            <div className="flex items-start space-x-2 text-sm">
                              <Phone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-blue-800">추가 연락처:</span>
                                <p className="text-blue-700 mt-1">{(record as any).contactInfo}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {record.completionNotes && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <div className="flex items-start">
                          <FileText className="h-4 w-4 text-green-600 mt-0.5 mr-2" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-green-800 mb-1">심방 일지</p>
                            <p className="text-green-700 text-sm line-clamp-3">
                              {record.completionNotes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!record.completionNotes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                          <p className="text-yellow-800 text-sm">심방 일지가 작성되지 않았습니다.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredRecords.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500">조건에 맞는 심방 기록이 없습니다.</p>
            </div>
          )}
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    위치 및 추가 정보
                  </h3>
                  <div className="space-y-4">
                    {selectedRequest.address && (
                      <div className="bg-white rounded-md p-3">
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800 mb-1">방문 주소</p>
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
                        <div className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
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
              {selectedRequest.status === 'pending' && (
                <Button onClick={() => handleSchedule(selectedRequest)}>
                  일정 조율
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 일정 조율 모달 */}
      {showScheduleModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">일정 조율</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
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
                  희망 일정: {selectedRequest.preferredDate} 
                  {selectedRequest.preferredTimeStart && ` ${selectedRequest.preferredTimeStart}`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  확정 날짜
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  확정 시간
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)}>
                취소
              </Button>
              <Button onClick={handleSaveSchedule} disabled={!scheduledDate || !scheduledTime}>
                일정 확정
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 담당자 배정 모달 */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style={{top: 0, left: 0, right: 0, bottom: 0, margin: 0, padding: '1rem'}}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">담당자 배정</h2>
              <button
                onClick={() => setShowAssignModal(false)}
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
                  심방 유형: {selectedRequest.requestType === 'general' ? '일반' : 
                           selectedRequest.requestType === 'urgent' ? '긴급' :
                           selectedRequest.requestType === 'hospital' ? '병원' : '상담'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  담당 목사 선택
                </label>
                <select
                  value={assignedPastorId}
                  onChange={(e) => setAssignedPastorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">담당자 선택</option>
                  <option value="pastor1">김목사</option>
                  <option value="pastor2">이목사</option>
                  <option value="pastor3">박목사</option>
                  <option value="pastor4">최목사</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowAssignModal(false)}>
                취소
              </Button>
              <Button onClick={handleSaveAssignment} disabled={!assignedPastorId}>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                  rows={8}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                  <div className="text-sm text-blue-800">
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
                className="bg-green-600 hover:bg-green-700 text-white"
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
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-blue-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-800 mb-1">방문 주소</p>
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    신청자명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRequest.requesterName}
                    onChange={(e) => setNewRequest({...newRequest, requesterName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="신청자 성명 입력"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>

              {/* 심방 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">심방 유형</label>
                  <select
                    value={newRequest.requestType}
                    onChange={(e) => setNewRequest({...newRequest, requestType: e.target.value as 'general' | 'urgent' | 'hospital' | 'counseling'})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="심방이 필요한 이유나 상황을 자세히 입력해주세요..."
                />
              </div>

              {/* 희망 일정 */}
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-3">희망 일정 (선택사항)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">희망 날짜</label>
                    <input
                      type="date"
                      value={newRequest.preferredDate}
                      onChange={(e) => setNewRequest({...newRequest, preferredDate: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">시작 시간</label>
                    <input
                      type="time"
                      value={newRequest.preferredTimeStart}
                      onChange={(e) => setNewRequest({...newRequest, preferredTimeStart: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">종료 시간</label>
                    <input
                      type="time"
                      value={newRequest.preferredTimeEnd}
                      onChange={(e) => setNewRequest({...newRequest, preferredTimeEnd: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
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
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 서울특별시 강남구 테헤란로 123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">추가 연락처 정보</label>
                    <input
                      type="text"
                      value={newRequest.contactInfo}
                      onChange={(e) => setNewRequest({...newRequest, contactInfo: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="예: 가족 연락처, 특이사항 등"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isUrgent"
                      checked={newRequest.isUrgent}
                      onChange={(e) => setNewRequest({...newRequest, isUrgent: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
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
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                등록하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PastoralCareManagement;
