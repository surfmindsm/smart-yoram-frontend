import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  MapPin, 
  Clock, 
  Eye,
  Heart,
  MessageCircle,
  HandHeart,
  Calendar
} from 'lucide-react';
import { Button } from '../ui/button';

interface RequestItem {
  id: number;
  title: string;
  description: string;
  category: string;
  requestedItem: string;
  quantity: number;
  reason: string;
  neededDate: string;
  church: string;
  location: string;
  contactInfo: string;
  status: 'requesting' | 'matching' | 'completed';
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
  urgency: 'low' | 'medium' | 'high';
}

const ItemRequest: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');

  // 임시 데이터
  const requestItems: RequestItem[] = [
    {
      id: 1,
      title: '주일학교 교재 급히 필요합니다',
      description: '새 학기를 맞아 주일학교에서 사용할 교재가 부족한 상황입니다. 유아부용 교재 위주로 필요합니다.',
      category: '도서',
      requestedItem: '주일학교 교재 (유아부용)',
      quantity: 30,
      reason: '새 학기 주일학교 수업 준비',
      neededDate: '2025-09-15',
      church: '소망교회',
      location: '인천 부평구 부평동',
      contactInfo: '010-1234-5678',
      status: 'requesting',
      createdAt: '1시간 전',
      views: 15,
      likes: 3,
      comments: 2,
      urgency: 'high'
    },
    {
      id: 2,
      title: '어린이 예배용 의자 구합니다',
      description: '어린이 예배당에서 사용할 작은 의자들이 필요합니다. 중고라도 상태가 양호하면 됩니다.',
      category: '가구',
      requestedItem: '어린이용 의자',
      quantity: 20,
      reason: '어린이 예배당 리모델링',
      neededDate: '2025-10-01',
      church: '새생명교회',
      location: '경기 수원시 영통구',
      contactInfo: '010-2345-6789',
      status: 'matching',
      createdAt: '3시간 전',
      views: 28,
      likes: 7,
      comments: 5,
      urgency: 'medium'
    },
    {
      id: 3,
      title: '찬양팀용 마이크 몇 개 빌려주실 곳 있나요?',
      description: '특별 찬양 발표회를 위해 무선 마이크가 추가로 필요합니다. 하루만 사용할 예정입니다.',
      category: '전자제품',
      requestedItem: '무선 마이크',
      quantity: 3,
      reason: '특별 찬양 발표회',
      neededDate: '2025-09-12',
      church: '은혜의강교회',
      location: '서울 마포구 합정동',
      contactInfo: '010-3456-7890',
      status: 'requesting',
      createdAt: '5시간 전',
      views: 12,
      likes: 2,
      comments: 1,
      urgency: 'medium'
    }
  ];

  const categories = [
    { value: 'all', label: '전체' },
    { value: '가구', label: '가구' },
    { value: '전자제품', label: '전자제품' },
    { value: '도서', label: '도서' },
    { value: '악기', label: '악기' },
    { value: '기타', label: '기타' }
  ];

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'requesting', label: '요청중' },
    { value: 'matching', label: '매칭중' },
    { value: 'completed', label: '완료' }
  ];

  const urgencyOptions = [
    { value: 'all', label: '전체 우선순위' },
    { value: 'high', label: '긴급' },
    { value: 'medium', label: '보통' },
    { value: 'low', label: '여유' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requesting':
        return 'bg-blue-100 text-blue-800';
      case 'matching':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'requesting':
        return '요청중';
      case 'matching':
        return '매칭중';
      case 'completed':
        return '완료';
      default:
        return '알 수 없음';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return '긴급';
      case 'medium':
        return '보통';
      case 'low':
        return '여유';
      default:
        return '보통';
    }
  };

  const filteredItems = requestItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.requestedItem.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesUrgency = selectedUrgency === 'all' || item.urgency === selectedUrgency;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesUrgency;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilNeeded = (neededDate: string) => {
    const today = new Date();
    const needed = new Date(neededDate);
    const diffTime = needed.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '기한 지남';
    if (diffDays === 0) return '오늘까지';
    if (diffDays === 1) return '내일까지';
    return `${diffDays}일 남음`;
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">물품 요청</h1>
          <p className="text-gray-600">
            필요한 물품을 다른 교회에 요청해보세요
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          요청 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색창 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="제목이나 물품명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 카테고리 선택 */}
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

          {/* 상태 선택 */}
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

          {/* 우선순위 선택 */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {urgencyOptions.map(urgency => (
              <option key={urgency.value} value={urgency.value}>
                {urgency.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 요청 목록 */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(item.urgency)}`}>
                  {getUrgencyText(item.urgency)}
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {item.category}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span className={item.urgency === 'high' ? 'text-red-600 font-medium' : ''}>
                  {getDaysUntilNeeded(item.neededDate)}
                </span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {item.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>요청 물품:</strong> {item.requestedItem}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>수량:</strong> {item.quantity}개
                </p>
                <p className="text-sm text-gray-600">
                  <strong>필요 이유:</strong> {item.reason}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>필요일:</strong> {formatDate(item.neededDate)}
                </p>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <strong className="mr-1">요청 교회:</strong> {item.church}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-3 w-3 mr-1" />
                  {item.location}
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">
              {item.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {item.createdAt}
                </span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {item.views}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button className="flex items-center text-xs text-gray-500 hover:text-red-500">
                    <Heart className="h-3 w-3 mr-1" />
                    {item.likes}
                  </button>
                  <button className="flex items-center text-xs text-gray-500 hover:text-blue-500">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {item.comments}
                  </button>
                </div>

                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <HandHeart className="h-3 w-3" />
                  도움주기
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <HandHeart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            검색 결과가 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            다른 검색어나 필터를 시도해보세요.
          </p>
          <Button variant="outline">
            전체 목록 보기
          </Button>
        </div>
      )}

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-8">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>이전</Button>
          <Button size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">다음</Button>
        </div>
      </div>
    </div>
  );
};

export default ItemRequest;