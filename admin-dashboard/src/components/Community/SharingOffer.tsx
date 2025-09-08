import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Truck
} from 'lucide-react';
import { Button } from '../ui/button';

interface OfferItem {
  id: number;
  title: string;
  itemName: string;
  category: string;
  condition: string;
  quantity: number;
  description: string;
  church: string;
  location: string;
  deliveryMethod: string;
  status: 'available' | 'reserved' | 'completed';
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
}

const SharingOffer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 임시 데이터
  const offerItems: OfferItem[] = [
    {
      id: 1,
      title: '교회 행사용 테이블 여러 개 제공합니다',
      itemName: '접이식 테이블',
      category: '가구',
      condition: '양호',
      quantity: 10,
      description: '교회 행사에서 사용하던 접이식 테이블들입니다. 상태가 좋아서 바로 사용 가능합니다.',
      church: '큰빛교회',
      location: '서울 송파구 잠실동',
      deliveryMethod: '직접 수령, 근거리 배달 가능',
      status: 'available',
      createdAt: '30분 전',
      views: 8,
      likes: 2,
      comments: 0
    },
    {
      id: 2,
      title: '찬양팀용 악보 폴더 나눔',
      itemName: '악보 정리 폴더',
      category: '기타',
      condition: '새것',
      quantity: 20,
      description: '새로 구입했는데 너무 많이 주문해서 남은 악보 폴더들입니다.',
      church: '소망의교회',
      location: '경기 성남시 분당구',
      deliveryMethod: '택배 발송 가능',
      status: 'available',
      createdAt: '2시간 전',
      views: 15,
      likes: 5,
      comments: 3
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
        return '제공 가능';
      case 'reserved':
        return '예약중';
      case 'completed':
        return '제공 완료';
      default:
        return '알 수 없음';
    }
  };

  const filteredItems = offerItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">나눔 제공</h1>
          <p className="text-gray-600">
            여분의 물품을 다른 교회에 제공해보세요
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          제공 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
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
        </div>
      </div>

      {/* 제공 목록 */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {item.category}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                  {getStatusText(item.status)}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500">
                <Truck className="h-4 w-4 mr-1" />
                <span>{item.deliveryMethod}</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {item.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>제공 물품:</strong> {item.itemName}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>수량:</strong> {item.quantity}개
                </p>
                <p className="text-sm text-gray-600">
                  <strong>상태:</strong> {item.condition}
                </p>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <strong className="mr-1">제공 교회:</strong> {item.church}
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
                  <Share2 className="h-3 w-3" />
                  수령 신청
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Share2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
          <Button variant="outline" size="sm">다음</Button>
        </div>
      </div>
    </div>
  );
};

export default SharingOffer;