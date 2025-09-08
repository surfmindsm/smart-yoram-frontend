import React, { useState } from 'react';
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

interface ChurchEvent {
  id: number;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  hostChurch: string;
  coHosts: string[];
  participantsLimit: number | null;
  registeredCount: number;
  registrationMethod: string;
  contactInfo: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: string;
  views: number;
  likes: number;
  category: 'seminar' | 'revival' | 'concert' | 'conference' | 'other';
}

const ChurchEvents: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const events: ChurchEvent[] = [
    {
      id: 1,
      title: '2025 겨울 청년 수련회',
      description: '새해를 맞이하여 청년들이 함께 모여 하나님과의 관계를 점검하고 새로운 비전을 나누는 시간입니다.',
      eventDate: '2025-01-15',
      location: '양평 청소년 수련원',
      hostChurch: '새빛교회',
      coHosts: ['은혜교회', '평강교회'],
      participantsLimit: 100,
      registeredCount: 67,
      registrationMethod: '교회 홈페이지',
      contactInfo: '010-1234-5678',
      status: 'upcoming',
      createdAt: '1주일 전',
      views: 234,
      likes: 45,
      category: 'other'
    },
    {
      id: 2,
      title: '찬양 세미나 - 예배자의 마음',
      description: '찬양팀과 예배 인도자들을 위한 특별 세미나입니다. 예배의 본질과 찬양 인도법을 배워보세요.',
      eventDate: '2025-09-20',
      location: '온라인 (Zoom)',
      hostChurch: '중앙교회',
      coHosts: [],
      participantsLimit: 200,
      registeredCount: 156,
      registrationMethod: '온라인 신청',
      contactInfo: '010-2345-6789',
      status: 'upcoming',
      createdAt: '3일 전',
      views: 189,
      likes: 32,
      category: 'seminar'
    },
    {
      id: 3,
      title: '지역 교회 연합 부흥회',
      description: '강남 지역 교회들이 함께하는 연합 부흥회입니다. 특별 강사 김○○ 목사님을 모십니다.',
      eventDate: '2025-09-25',
      location: '강남구민회관 대강당',
      hostChurch: '강남제일교회',
      coHosts: ['새빛교회', '은혜교회', '평강교회', '소망교회'],
      participantsLimit: null,
      registeredCount: 0,
      registrationMethod: '현장 등록',
      contactInfo: '02-1234-5678',
      status: 'upcoming',
      createdAt: '5일 전',
      views: 312,
      likes: 78,
      category: 'revival'
    }
  ];

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

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">교회 행사/소식</h1>
          <p className="text-gray-600">
            다양한 교회 행사와 소식을 확인하고 참여해보세요
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          행사 등록
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEvents.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                    {categories.find(c => c.value === event.category)?.label || event.category}
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
                  {formatDate(event.eventDate)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-red-500" />
                  {event.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2 text-green-500" />
                  주최: {event.hostChurch}
                  {event.coHosts.length > 0 && (
                    <span className="ml-1 text-gray-500">
                      외 {event.coHosts.length}개 교회
                    </span>
                  )}
                </div>
                {event.participantsLimit && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-purple-500" />
                    신청: {event.registeredCount}/{event.participantsLimit}명
                    <div className="ml-2 w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${(event.registeredCount / event.participantsLimit) * 100}%` }}
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
                  <Button size="sm" variant="outline">
                    자세히 보기
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredEvents.length === 0 && (
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