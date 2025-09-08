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
  Image as ImageIcon,
  Gift
} from 'lucide-react';
import { Button } from '../ui/button';

interface SharingItem {
  id: number;
  title: string;
  description: string;
  category: string;
  condition: string;
  quantity: number;
  images: string[];
  church: string;
  location: string;
  contactInfo: string;
  status: 'available' | 'reserved' | 'completed';
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
}

const FreeSharing: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // 임시 데이터
  const sharingItems: SharingItem[] = [
    {
      id: 1,
      title: '유아용 의자와 책상 세트 나눔합니다',
      description: '아이가 커서 더 이상 사용하지 않는 유아용 의자와 책상입니다. 상태 양호하고 깨끗하게 관리했습니다.',
      category: '가구',
      condition: '양호',
      quantity: 1,
      images: [],
      church: '새빛교회',
      location: '서울 강남구 역삼동',
      contactInfo: '010-1234-5678',
      status: 'available',
      createdAt: '2시간 전',
      views: 24,
      likes: 5,
      comments: 3
    },
    {
      id: 2,
      title: '주일학교 교재 및 워크북 (50권)',
      description: '주일학교에서 사용했던 교재들입니다. 일부 사용감은 있지만 재사용 가능한 상태입니다.',
      category: '도서',
      condition: '보통',
      quantity: 50,
      images: [],
      church: '은혜교회',
      location: '부산 해운대구 우동',
      contactInfo: '010-2345-6789',
      status: 'reserved',
      createdAt: '4시간 전',
      views: 18,
      likes: 2,
      comments: 1
    },
    {
      id: 3,
      title: '찬양용 기타 (어쿠스틱)',
      description: '찬양팀에서 사용했던 어쿠스틱 기타입니다. 약간의 스크래치는 있지만 연주에는 문제없습니다.',
      category: '악기',
      condition: '양호',
      quantity: 1,
      images: [],
      church: '평강교회',
      location: '대구 중구 동성로',
      contactInfo: '010-3456-7890',
      status: 'available',
      createdAt: '6시간 전',
      views: 32,
      likes: 8,
      comments: 5
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
    { value: 'available', label: '나눔 가능' },
    { value: 'reserved', label: '예약중' },
    { value: 'completed', label: '나눔 완료' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '나눔 가능';
      case 'reserved':
        return '예약중';
      case 'completed':
        return '나눔 완료';
      default:
        return '알 수 없음';
    }
  };

  const filteredItems = sharingItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">무료 나눔</h1>
          <p className="text-gray-600">
            사용하지 않는 물품을 다른 교회와 나누어요
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          나눔 등록
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
              placeholder="제목이나 내용으로 검색..."
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

          {/* 필터 버튼 */}
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            필터
          </Button>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
            {/* 이미지 영역 */}
            <div className="h-48 bg-gray-100 flex items-center justify-center relative">
              {item.images.length > 0 ? (
                <img 
                  src={item.images[0]} 
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <span className="text-sm">이미지 없음</span>
                </div>
              )}
              
              {/* 상태 뱃지 */}
              <div className="absolute top-2 right-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
              </div>
            </div>

            {/* 콘텐츠 */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {item.category}
                </span>
                <span className="text-xs text-gray-500">
                  수량: {item.quantity}개
                </span>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {item.title}
              </h3>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {item.description}
              </p>

              <div className="flex items-center text-xs text-gray-500 mb-3 space-x-3">
                <span>{item.church}</span>
                <span className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  {item.location}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {item.createdAt}
                  </span>
                  <span className="flex items-center">
                    <Eye className="h-3 w-3 mr-1" />
                    {item.views}
                  </span>
                </div>

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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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

      {/* 페이지네이션 (추후 구현) */}
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

export default FreeSharing;