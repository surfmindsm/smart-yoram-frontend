import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  Calendar,
  Users,
  Eye,
  Heart,
  Share
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService, ChurchEvent } from '../../services/communityService';


const ChurchEvents: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: 'all', label: '전체' },
    { value: 'seminar', label: '세미나' },
    { value: 'revival', label: '부흥회' },
    { value: 'concert', label: '찬양집회' },
    { value: 'conference', label: '컨퍼런스' },
    { value: 'other', label: '기타' }
  ];

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'upcoming', label: '예정' },
    { value: 'ongoing', label: '진행중' },
    { value: 'completed', label: '완료' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'seminar':
        return 'bg-purple-100 text-purple-800';
      case 'revival':
        return 'bg-red-100 text-red-800';
      case 'concert':
        return 'bg-yellow-100 text-yellow-800';
      case 'conference':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await communityService.getChurchEvents({
          eventType: selectedCategory === 'all' ? undefined : selectedCategory,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          search: searchTerm || undefined,
          limit: 50
        });
        setEvents(data);
      } catch (error) {
        console.error('ChurchEvents 데이터 로드 실패:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, selectedStatus, searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">행사 소식</h1>
          <p className="text-gray-600">
            다양한 교회 행사와 소식을 확인하고 참여해보세요
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          행사 소식 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="행사명이나 내용으로 검색..."
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

      {/* 행사 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">교회 행사 목록을 불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.eventType)}`}>
                    {categories.find(c => c.value === event.eventType)?.label || event.eventType}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {statusOptions.find(s => s.value === event.status)?.label || event.status}
                  </span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {event.title}
              </h3>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {event.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  {formatDate(event.startDate)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-red-500" />
                  {event.location}
                </div>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span><strong>담당자:</strong> {event.userName || '익명'}</span>
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-green-500" />
                    <strong>주최:</strong> {event.church || '협력사'}
                  </span>
                </div>
                {event.registrationRequired && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-purple-500" />
                    신청: {event.currentParticipants}/{event.capacity}명
                    <div className="ml-2 w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${(event.currentParticipants / event.capacity) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {event.createdAt}
                  </span>
                  <span className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {event.views}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="flex items-center text-xs text-gray-500 hover:text-red-500">
                    <Heart className="h-3 w-3 mr-1" />
                    {event.likes}
                  </button>
                  <button className="flex items-center text-xs text-gray-500 hover:text-blue-500">
                    <Share className="h-3 w-3 mr-1" />
                    공유
                  </button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/community/church-events/${event.id}`)}
                  >
                    자세히 보기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            검색 결과가 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            다른 검색어나 필터를 시도해보세요.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChurchEvents;