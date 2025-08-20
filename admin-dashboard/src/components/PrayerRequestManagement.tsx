import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { prayerRequestService } from '../services/api';
import {
  Heart, Calendar, Clock, Phone, User, Filter, Search, 
  MoreHorizontal, Eye, Edit, CheckCircle, XCircle, 
  MessageSquare, Users, Globe, Lock, AlertTriangle,
  BookOpen, Star, Timer
} from 'lucide-react';

interface PrayerRequest {
  id: string;
  requesterName: string;
  requesterPhone?: string;
  memberId?: string;
  prayerType: 'general' | 'healing' | 'family' | 'work' | 'spiritual' | 'thanksgiving';
  prayerContent: string;
  isAnonymous: boolean;
  isUrgent: boolean;
  status: 'active' | 'answered' | 'closed';
  isPublic: boolean;
  adminNotes?: string;
  answeredTestimony?: string;
  prayerCount: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  expiresAt: string;
}

const PrayerRequestManagement: React.FC = () => {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);

  // API에서 중보 기도 요청 데이터 로드
  useEffect(() => {
    loadPrayerRequests();
  }, [statusFilter, typeFilter, visibilityFilter]);

  const loadPrayerRequests = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.prayer_type = typeFilter;
      if (visibilityFilter !== 'all') params.is_public = visibilityFilter === 'public';
      
      const response = await prayerRequestService.getRequests(params);
      
      // 백엔드 응답 구조 확인 및 데이터 추출
      console.log('Prayer requests API response:', response);
      
      let prayerRequestsData = [];
      
      // 다양한 응답 구조에 대응
      if (Array.isArray(response)) {
        prayerRequestsData = response;
      } else if (response && Array.isArray(response.data)) {
        prayerRequestsData = response.data;
      } else if (response && Array.isArray(response.items)) {
        prayerRequestsData = response.items;
      } else if (response && Array.isArray(response.results)) {
        prayerRequestsData = response.results;
      } else {
        console.warn('Unexpected response structure:', response);
        prayerRequestsData = [];
      }
      
      // 백엔드 응답 데이터를 프론트엔드 인터페이스에 맞게 변환
      const transformedRequests: PrayerRequest[] = prayerRequestsData.map((item: any) => ({
        id: item.id,
        requesterName: !item.is_public ? '익명' : item.requester_name,
        requesterPhone: item.requester_phone,
        memberId: item.member_id,
        prayerType: item.prayer_type,
        prayerContent: item.prayer_content,
        isAnonymous: item.is_anonymous,
        isUrgent: item.is_urgent,
        status: item.status,
        isPublic: item.is_public,
        adminNotes: item.admin_notes,
        answeredTestimony: item.answered_testimony,
        prayerCount: item.prayer_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        closedAt: item.closed_at,
        expiresAt: item.expires_at
      }));
      
      setRequests(transformedRequests);
    } catch (error) {
      console.error('Failed to load prayer requests:', error);
      // 에러 발생 시 빈 배열로 설정
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'answered': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '진행중';
      case 'answered': return '응답됨';
      case 'closed': return '마감';
      default: return '알 수 없음';
    }
  };

  const getPrayerTypeText = (type: string) => {
    switch (type) {
      case 'general': return '일반';
      case 'healing': return '치유';
      case 'family': return '가정';
      case 'work': return '직장/사업';
      case 'spiritual': return '영성';
      case 'thanksgiving': return '감사';
      default: return '일반';
    }
  };

  const getPrayerTypeColor = (type: string) => {
    switch (type) {
      case 'healing': return 'text-red-600';
      case 'family': return 'text-blue-600';
      case 'work': return 'text-green-600';
      case 'spiritual': return 'text-purple-600';
      case 'thanksgiving': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const filteredRequests = requests.filter(request => {
    const searchContent = !request.isPublic ? 
      request.prayerContent.toLowerCase() : 
      `${request.requesterName} ${request.prayerContent}`.toLowerCase();
    
    const matchesSearch = searchContent.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.prayerType === typeFilter;
    const matchesVisibility = visibilityFilter === 'all' || 
      (visibilityFilter === 'public' && request.isPublic) ||
      (visibilityFilter === 'private' && !request.isPublic);
    
    return matchesSearch && matchesStatus && matchesType && matchesVisibility;
  });

  const handleViewDetails = (request: PrayerRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleMarkAnswered = (request: PrayerRequest) => {
    setSelectedRequest(request);
    setShowAnswerModal(true);
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

  const handleVisibilityToggle = (requestId: string) => {
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, isPublic: !req.isPublic, updatedAt: new Date().toISOString() }
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
          <h1 className="text-2xl font-bold text-slate-900">중보 기도 요청 관리</h1>
          <p className="text-slate-600 mt-1">교인들의 기도 요청을 관리하고 응답을 기록하세요</p>
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
              <p className="text-sm text-slate-600">진행중</p>
              <p className="text-2xl font-bold text-green-600">
                {requests.filter(r => r.status === 'active').length}
              </p>
            </div>
            <Heart className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">응답됨</p>
              <p className="text-2xl font-bold text-blue-600">
                {requests.filter(r => r.status === 'answered').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">총 기도수</p>
              <p className="text-2xl font-bold text-purple-600">
                {requests.reduce((sum, r) => sum + r.prayerCount, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">전체</p>
              <p className="text-2xl font-bold text-slate-900">{requests.length}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-slate-600" />
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
              placeholder="기도 요청 내용으로 검색..."
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
                <option value="active">진행중</option>
                <option value="answered">응답됨</option>
                <option value="closed">마감</option>
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
                <option value="general">일반</option>
                <option value="healing">치유</option>
                <option value="family">가정</option>
                <option value="work">직장/사업</option>
                <option value="spiritual">영성</option>
                <option value="thanksgiving">감사</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">공개 설정</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
              >
                <option value="all">전체</option>
                <option value="public">공개</option>
                <option value="private">비공개</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 기도 요청 목록 */}
      <div className="space-y-4">
        {filteredRequests.map((request) => (
          <div 
            key={request.id} 
            className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleViewDetails(request)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center space-x-2">
                    {!request.isPublic ? (
                      <Lock className="h-4 w-4 text-slate-400" />
                    ) : (
                      <User className="h-4 w-4 text-slate-600" />
                    )}
                    <span className="font-medium text-slate-900">
                      {!request.isPublic ? '익명' : request.requesterName}
                    </span>
                  </div>
                  
                  {/* <span className={cn(
                    "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                    getStatusColor(request.status)
                  )}>
                    {getStatusText(request.status)}
                  </span> */}
                  
                  {/* <span className={cn("text-sm font-medium", getPrayerTypeColor(request.prayerType))}>
                    {getPrayerTypeText(request.prayerType)}
                  </span> */}
                  
                  {request.isUrgent && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  
                  {/* {request.isPublic ? (
                    <div title="공개">
                      <Globe className="h-4 w-4 text-green-500" />
                    </div>
                  ) : (
                    <div title="비공개">
                      <Lock className="h-4 w-4 text-gray-500" />
                    </div>
                  )} */}
                </div>
                
                <p className="text-slate-700 mb-3 leading-relaxed">
                  {request.prayerContent}
                </p>
                
                {request.answeredTestimony && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-3">
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-blue-800">응답 간증</span>
                    </div>
                    <p className="text-blue-700 text-sm">{request.answeredTestimony}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{request.prayerCount}명이 기도함</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(request.createdAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Timer className="h-4 w-4" />
                      <span>만료: {new Date(request.expiresAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <Heart className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">조건에 맞는 기도 요청이 없습니다.</p>
        </div>
      )}

      {/* 상세 보기 모달 */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-slate-900">기도 요청 상세</h2>
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
                  <h3 className="text-sm font-medium text-slate-700 mb-2">요청자 정보</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">이름:</span> {!selectedRequest.isPublic ? '익명' : selectedRequest.requesterName}</p>
                    {selectedRequest.isPublic && selectedRequest.requesterPhone && (
                      <p><span className="font-medium">전화번호:</span> {selectedRequest.requesterPhone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">기도 요청 정보</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">유형:</span> {getPrayerTypeText(selectedRequest.prayerType)}</p>
                    <p><span className="font-medium">상태:</span> {getStatusText(selectedRequest.status)}</p>
                    <p><span className="font-medium">공개 설정:</span> {selectedRequest.isPublic ? '공개' : '비공개'}</p>
                    <p><span className="font-medium">긴급 여부:</span> {selectedRequest.isUrgent ? '긴급' : '일반'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">기도 요청 내용</h3>
                <p className="text-slate-900 bg-slate-50 p-3 rounded-md">
                  {selectedRequest.prayerContent}
                </p>
              </div>

              {selectedRequest.answeredTestimony && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">응답 간증</h3>
                  <p className="text-slate-900 bg-blue-50 p-3 rounded-md">
                    {selectedRequest.answeredTestimony}
                  </p>
                </div>
              )}

              {selectedRequest.adminNotes && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">관리자 메모</h3>
                  <p className="text-slate-900 bg-yellow-50 p-3 rounded-md">
                    {selectedRequest.adminNotes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">기도 참여:</span> {selectedRequest.prayerCount}명
                </div>
                <div>
                  <span className="font-medium">등록일:</span> {new Date(selectedRequest.createdAt).toLocaleDateString('ko-KR')}
                </div>
                <div>
                  <span className="font-medium">만료일:</span> {new Date(selectedRequest.expiresAt).toLocaleDateString('ko-KR')}
                </div>
              </div>
            </div>

            {/* <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                닫기
              </Button>
              {selectedRequest.status === 'active' && (
                <Button onClick={() => handleMarkAnswered(selectedRequest)}>
                  응답 표시
                </Button>
              )}
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrayerRequestManagement;
