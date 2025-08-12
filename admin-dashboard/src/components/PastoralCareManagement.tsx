import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { pastoralCareService } from '../services/api';
import {
  UserCheck, Calendar, Clock, Phone, MapPin, User,
  Filter, Search, MoreHorizontal, Eye, Edit, CheckCircle,
  XCircle, AlertTriangle, Calendar as CalendarIcon,
  MessageSquare, FileText, Clock3
} from 'lucide-react';

interface PastoralCareRequest {
  id: string;
  requesterName: string;
  requesterPhone: string;
  memberId?: string;
  requestType: 'general' | 'urgent' | 'hospital' | 'counseling';
  requestContent: string;
  preferredDate?: string;
  preferredTimeStart?: string;
  preferredTimeEnd?: string;
  status: 'pending' | 'approved' | 'scheduled' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assignedPastor?: {
    id: string;
    name: string;
    phone: string;
  };
  scheduledDate?: string;
  scheduledTime?: string;
  completionNotes?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

const PastoralCareManagement: React.FC = () => {
  const [requests, setRequests] = useState<PastoralCareRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PastoralCareRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // API에서 심방 신청 데이터 로드
  useEffect(() => {
    loadPastoralCareRequests();
  }, [statusFilter, priorityFilter, typeFilter]);

  const loadPastoralCareRequests = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (typeFilter !== 'all') params.request_type = typeFilter;
      
      const response = await pastoralCareService.getRequests(params);
      
      // 백엔드 응답 데이터를 프론트엔드 인터페이스에 맞게 변환
      const transformedRequests: PastoralCareRequest[] = response.map((item: any) => ({
        id: item.id,
        requesterName: item.requester_name,
        requesterPhone: item.requester_phone,
        memberId: item.member_id,
        requestType: item.request_type,
        requestContent: item.request_content,
        preferredDate: item.preferred_date,
        preferredTimeStart: item.preferred_time_start,
        preferredTimeEnd: item.preferred_time_end,
        status: item.status,
        priority: item.priority,
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
        completedAt: item.completed_at
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

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requestContent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || request.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || request.requestType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesType;
  });

  const handleViewDetails = (request: PastoralCareRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleSchedule = (request: PastoralCareRequest) => {
    setSelectedRequest(request);
    setShowScheduleModal(true);
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
          <h1 className="text-2xl font-bold text-slate-900">심방 신청 관리</h1>
          <p className="text-slate-600 mt-1">교인들의 심방 신청을 관리하고 일정을 조율하세요</p>
        </div>
        <div className="flex items-center space-x-3">
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

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">대기중</p>
              <p className="text-2xl font-bold text-yellow-600">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <Clock3 className="h-8 w-8 text-yellow-600" />
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
            <CalendarIcon className="h-8 w-8 text-purple-600" />
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
            <UserCheck className="h-8 w-8 text-slate-600" />
          </div>
        </div>
      </div>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
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
          </div>
        )}
      </div>

      {/* 심방 신청 목록 */}
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
                <tr key={request.id} className="hover:bg-slate-50">
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
                    <span className="text-sm text-slate-900">
                      {getRequestTypeText(request.requestType)}
                    </span>
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
                    {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSchedule(request)}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <UserCheck className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">조건에 맞는 심방 신청이 없습니다.</p>
        </div>
      )}

      {/* 상세 보기 모달 */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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

              {selectedRequest.assignedPastor && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">담당 목사</h3>
                  <p><span className="font-medium">이름:</span> {selectedRequest.assignedPastor.name}</p>
                  <p><span className="font-medium">전화번호:</span> {selectedRequest.assignedPastor.phone}</p>
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
    </div>
  );
};

export default PastoralCareManagement;
