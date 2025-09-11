import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Clock, 
  Eye,
  MessageCircle,
  Sparkles,
  User,
  CheckCircle,
  HandHeart
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService, PrayerRequest } from '../../services/communityService';


const PrayerRequests: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'healing', label: '건강/치유' },
    { value: 'family', label: '가정/가족' },
    { value: 'job', label: '직업/학업' },
    { value: 'church', label: '교회/사역' },
    { value: 'other', label: '기타' }
  ];

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'requesting', label: '기도 요청' },
    { value: 'ongoing', label: '기도 중' },
    { value: 'answered', label: '응답/간증' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requesting':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'answered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'requesting':
        return '기도 요청';
      case 'ongoing':
        return '기도 중';
      case 'answered':
        return '응답/간증';
      default:
        return '알 수 없음';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'healing':
        return 'bg-red-100 text-red-800';
      case 'family':
        return 'bg-pink-100 text-pink-800';
      case 'job':
        return 'bg-blue-100 text-blue-800';
      case 'church':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await communityService.getPrayerRequests({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          search: searchTerm || undefined,
          limit: 50
        });
        setPrayerRequests(data);
      } catch (error) {
        console.error('PrayerRequests 데이터 로드 실패:', error);
        setPrayerRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, selectedStatus, searchTerm]);

  const handlePrayFor = (requestId: number) => {
    // 기도했습니다 버튼 클릭 처리
    console.log('기도함:', requestId);
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">기도 요청</h1>
          <p className="text-gray-600">
            서로의 기도 제목을 나누고 함께 기도해요
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          기도 요청
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="제목이나 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 기도 요청 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">기도 요청 목록을 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prayerRequests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(request.category)}`}>
                  {categories.find(c => c.value === request.category)?.label}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
                {!request.isPublic && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    익명
                  </span>
                )}
              </div>
              
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-1" />
                {request.requesterName}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {request.title}
            </h3>

            <p className="text-gray-700 mb-4 leading-relaxed">
              {request.content}
            </p>

            {/* 간증 기능이 없어서 숨김 */}
            {false && request.content && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-800 mb-1">기도 응답 간증</h4>
                    <p className="text-sm text-green-700">{request.content}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <HandHeart className="h-4 w-4 mr-1 text-red-500" />
                  {request.prayerCount}명이 기도함
                </span>
                <span className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {request.createdAt}
                </span>
                <span className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {request.views}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button className="flex items-center text-sm text-gray-500 hover:text-blue-500">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  조회 {request.views}
                </button>

                <Button 
                  size="sm" 
                  onClick={() => handlePrayFor(request.id)}
                  className={`flex items-center gap-1 ${
                    request.status === 'answered' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {request.status === 'answered' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      감사합니다
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      기도했습니다
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && prayerRequests.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            검색 결과가 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            다른 검색어나 필터를 시도해보세요.
          </p>
        </div>
      )}

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-8">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>이전</Button>
          <Button size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">다음</Button>
        </div>
      </div>
    </div>
  );
};

export default PrayerRequests;