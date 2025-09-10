import React, { useState, useEffect } from 'react';
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
import { communityService, SharingItem } from '../../services/communityService';
import { api, getApiUrl } from '../../services/api';

const FreeSharing: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // 나눔 게시글 데이터 (API에서 로드)
  const [sharingItems, setSharingItems] = useState<SharingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 제거됨: 모달 대신 별도 페이지 사용

  // 상세보기 모달 상태

  useEffect(() => {
    const fetchSharingItems = async () => {
      try {
        setLoading(true);
        const data = await communityService.getSharingItems({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          search: searchTerm || undefined,
          limit: 50
        });
        console.log('🎯 FreeSharing 컴포넌트에서 받은 데이터:', data);
        console.log('🎯 데이터 길이:', data.length);
        setSharingItems(data);
      } catch (error) {
        console.error('무료 나눔 데이터 로드 실패:', error);
        setSharingItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSharingItems();
  }, [selectedCategory, selectedStatus, searchTerm]);

  // 제거됨: 등록 기능은 별도 페이지로 이동

  const handleItemClick = (item: SharingItem) => {
    window.location.href = `/community/free-sharing/${item.id}`;
  };

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
    const matchesSearch = (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  console.log('🔍 loading 상태:', loading);
  console.log('🔍 sharingItems 상태:', sharingItems);
  console.log('🔍 sharingItems[0]:', sharingItems[0]);
  console.log('🔍 sharingItems[0]?.images:', sharingItems[0]?.images);
  console.log('🔍 filteredItems 결과:', filteredItems);
  console.log('🔍 filteredItems[0]:', filteredItems[0]);
  console.log('🔍 filteredItems[0]?.images:', filteredItems[0]?.images);
  console.log('🔍 filteredItems.length:', filteredItems.length);
  console.log('🔍 현재 필터 - 카테고리:', selectedCategory, '상태:', selectedStatus, '검색어:', searchTerm);

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
        <Button 
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/community/free-sharing/create'}
        >
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
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">데이터를 불러오는 중...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleItemClick(item)}
          >
            {/* 이미지 영역 */}
            <div className="h-48 bg-gray-100 flex items-center justify-center relative">
              {(item.images?.length || 0) > 0 ? (
                <>
                  <img 
                    src={item.images[0]} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('이미지 로딩 실패:', item.images[0]);
                      // 이미지 로딩 실패 시 부모 요소에서 숨기고 대체 UI 표시
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        e.currentTarget.style.display = 'none';
                        const fallback = parent.querySelector('.image-fallback') as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }
                    }}
                    onLoad={() => {
                      console.log('이미지 로딩 성공:', item.images[0]);
                    }}
                  />
                  <div className="image-fallback absolute inset-0 flex-col items-center justify-center text-gray-400" style={{display: 'none'}}>
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <span className="text-sm">이미지 로딩 실패</span>
                    <span className="text-xs text-gray-500 mt-1">서버 접근 불가</span>
                  </div>
                </>
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
      )}

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
          <Button key="prev" variant="outline" size="sm" disabled>이전</Button>
          <Button key="page-1" size="sm">1</Button>
          <Button key="page-2" variant="outline" size="sm">2</Button>
          <Button key="page-3" variant="outline" size="sm">3</Button>
          <Button key="next" variant="outline" size="sm">다음</Button>
        </div>
      </div>

      {/* 제거됨: 등록은 별도 페이지에서 처리 */}

      {/* 상세보기 모달 */}
    </div>
  );
};

// 상세보기 모달 컴포넌트
const SharingDetailModal: React.FC<{
  isOpen: boolean;
  item: SharingItem;
  onClose: () => void;
}> = ({ isOpen, item, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      (prev + 1) % (item.images?.length || 1)
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? (item.images?.length || 1) - 1 : prev - 1
    );
  };

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          {/* 닫기 버튼 */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 이미지 슬라이더 */}
          <div className="relative h-96 bg-gray-100">
            {item.images && item.images.length > 0 ? (
              <>
                <img 
                  src={item.images[currentImageIndex]} 
                  alt={`${item.title} - ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('상세보기 이미지 로딩 실패:', item.images[currentImageIndex]);
                  }}
                  onLoad={() => {
                    console.log('상세보기 이미지 로딩 성공:', item.images[currentImageIndex]);
                  }}
                />
                
                {item.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 transition-all"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* 이미지 인디케이터 */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {item.images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all ${
                            index === currentImageIndex 
                              ? 'bg-white' 
                              : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <ImageIcon className="h-16 w-16 mb-4" />
                <span>이미지가 없습니다</span>
              </div>
            )}
          </div>

          {/* 컨텐츠 */}
          <div className="p-6">
            {/* 헤더 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {item.category}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h2>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            </div>

            {/* 상세 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-gray-500 font-medium w-20">상태:</span>
                  <span className="text-gray-900">{item.condition || '정보 없음'}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 font-medium w-20">수량:</span>
                  <span className="text-gray-900">{item.quantity || 1}개</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-500 font-medium w-20">교회:</span>
                  <span className="text-gray-900">{item.church}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{item.location}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-900">{item.createdAt}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-gray-500">
                    <Eye className="h-4 w-4 mr-1" />
                    {item.views}
                  </span>
                  <span className="flex items-center text-gray-500">
                    <Heart className="h-4 w-4 mr-1" />
                    {item.likes}
                  </span>
                  <span className="flex items-center text-gray-500">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {item.comments}
                  </span>
                </div>
              </div>
            </div>

            {/* 연락처 및 액션 버튼 */}
            <div className="border-t pt-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">연락처 정보</h3>
                  <p className="text-gray-600">{item.contactInfo}</p>
                </div>
                
                {item.status === 'available' && (
                  <div className="flex space-x-3">
                    <Button className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      문의하기
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      찜하기
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeSharing;