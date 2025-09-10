import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Heart,
  Share2,
  Eye,
  Clock,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService, SharingItem } from '../../services/communityService';

const FreeSharingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<SharingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      fetchItemDetail(parseInt(id));
    }
  }, [id]);

  const fetchItemDetail = async (itemId: number) => {
    try {
      setLoading(true);
      // 목록에서 해당 아이템 찾기 (임시 방법)
      const items = await communityService.getSharingItems();
      const foundItem = items.find(item => item.id === itemId);
      
      if (foundItem) {
        setItem(foundItem);
        // 조회수 증가 API 호출 (필요시)
        // await communityService.incrementViews(itemId);
      } else {
        setError('해당 게시물을 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('상세 정보 조회 실패:', err);
      setError('상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
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
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '나눔 가능';
      case 'reserved':
        return '예약됨';
      case 'completed':
        return '나눔 완료';
      default:
        return status;
    }
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setSelectedImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!item?.images?.length) return;
    
    const newIndex = direction === 'prev' 
      ? (currentImageIndex - 1 + item.images.length) % item.images.length
      : (currentImageIndex + 1) % item.images.length;
    
    setCurrentImageIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">상세 정보를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{error || '게시물을 찾을 수 없습니다.'}</p>
          <Button onClick={() => navigate('/community/free-sharing')}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/community/free-sharing')}
          className="flex items-center gap-2 mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">무료 나눔 상세</h1>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* 이미지 섹션 */}
        {item.images && item.images.length > 0 && (
          <div className="relative">
            <div className="h-96 bg-gray-100 flex items-center justify-center">
              <img 
                src={item.images[0]} 
                alt={item.title}
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => handleImageClick(0)}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="flex flex-col items-center justify-center text-gray-400"><div class="text-4xl mb-2">🖼️</div><span>이미지 로딩 실패</span></div>';
                  }
                }}
              />
            </div>
            
            {/* 추가 이미지들 */}
            {item.images.length > 1 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2 overflow-x-auto">
                  {item.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${item.title} ${index + 1}`}
                      className="w-16 h-16 object-cover rounded cursor-pointer border-2 border-transparent hover:border-blue-500"
                      onClick={() => handleImageClick(index)}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          {/* 상태와 카테고리 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {item.category}
              </span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {getStatusText(item.status)}
              </span>
            </div>
          </div>

          {/* 제목 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{item.title}</h2>

          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="font-medium">위치:</span>
              <span className="ml-1">{item.location}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">교회:</span>
              <span className="ml-1">{item.church}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span className="font-medium">등록일:</span>
              <span className="ml-1">{item.createdAt}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Eye className="h-4 w-4 mr-2" />
              <span className="font-medium">조회수:</span>
              <span className="ml-1">{item.views}</span>
            </div>
            {item.quantity && (
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium">수량:</span>
                <span className="ml-1">{item.quantity}개</span>
              </div>
            )}
          </div>

          {/* 설명 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">상세 설명</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
            </div>
          </div>

          {/* 연락처 정보 */}
          {item.contactInfo && (
            <div className="mb-6 p-4 border rounded-lg bg-blue-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">연락처 정보</h3>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="font-medium">연락처:</span>
                  <span className="ml-1 text-blue-600">
                    {item.contactInfo}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 통계 정보 */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                조회 {item.views}
              </span>
              <span className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                좋아요 {item.likes || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 상세보기 모달 */}
      {selectedImageIndex !== null && item.images && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={closeImageModal}>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img
              src={item.images[currentImageIndex]}
              alt={`${item.title} ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* 닫기 버튼 */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* 네비게이션 버튼들 */}
            {item.images.length > 1 && (
              <>
                <button
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* 이미지 카운터 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
              {currentImageIndex + 1} / {item.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreeSharingDetail;