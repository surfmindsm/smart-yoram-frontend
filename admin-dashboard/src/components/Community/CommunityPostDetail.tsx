import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Eye,
  Heart,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Building,
  Tag
} from 'lucide-react';
import { Button } from '../ui/button';
import { formatCreatedAt } from '../../utils/dateUtils';

// 공통 게시글 상세 인터페이스
export interface PostDetailData {
  id: number;
  type: string;
  title: string;
  description: string;
  images?: string[];
  
  // 메타 정보
  views: number;
  likes: number;
  createdAt: string;
  status?: string;
  category?: string;
  
  // 위치/연락 정보
  church?: string | null;
  location?: string;
  contactInfo?: string;
  email?: string;
  
  // 추가 필드들 (타입별로 다를 수 있음)
  [key: string]: any;
}

interface CommunityPostDetailProps {
  post: PostDetailData;
  loading: boolean;
  error?: string | null;
  onBack: () => void;
  pageTitle: string;
  
  // 타입별 필드 매핑
  fieldMappings?: {
    label: string;
    key: string;
    type?: 'text' | 'badge' | 'date' | 'array';
    color?: string;
    render?: (value: any, post?: PostDetailData) => React.ReactNode;
  }[];
}

const CommunityPostDetail: React.FC<CommunityPostDetailProps> = ({ 
  post, 
  loading, 
  error, 
  onBack, 
  pageTitle,
  fieldMappings = []
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setSelectedImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (!post?.images?.length) return;
    
    const newIndex = direction === 'prev' 
      ? (currentImageIndex - 1 + post.images.length) % post.images.length
      : (currentImageIndex + 1) % post.images.length;
    
    setCurrentImageIndex(newIndex);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'active':
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'reserved':
      case 'matching':
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
      case 'closed':
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const renderFieldValue = (field: any, value: any, post?: PostDetailData) => {
    if (!value) return null;
    
    // 커스텀 렌더 함수가 있으면 사용
    if (field.render) {
      return field.render(value, post);
    }
    
    switch (field.type) {
      case 'badge':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${field.color || 'bg-blue-100 text-blue-800'}`}>
            {value}
          </span>
        );
      case 'array':
        if (Array.isArray(value)) {
          return (
            <div className="flex flex-wrap gap-1">
              {value.map((item, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {item}
                </span>
              ))}
            </div>
          );
        }
        return value;
      case 'date':
        return formatCreatedAt(value);
      default:
        return value;
    }
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

  if (error || !post) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{error || '게시물을 찾을 수 없습니다.'}</p>
          <Button onClick={onBack}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2 mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 메인 정보 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 기본 정보 카드 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {/* 제목과 상태 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {post.category && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Tag className="h-3 w-3 mr-1" />
                      {post.category}
                    </span>
                  )}
                  {post.status && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                  {post.title}
                </h2>
              </div>
            </div>

            {/* 설명 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">상세 설명</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {post.description}
                </p>
              </div>
            </div>

            {/* 추가 필드들 */}
            {fieldMappings.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">추가 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fieldMappings.map((field, index) => {
                    const value = post[field.key];
                    if (!value) return null;
                    
                    return (
                      <div key={index} className="flex flex-col">
                        <span className="text-sm font-medium text-gray-500 mb-1">
                          {field.label}
                        </span>
                        <div className="text-sm text-gray-900">
                          {renderFieldValue(field, value, post)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 기본 메타 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium">등록일</div>
                  <div>{formatCreatedAt(post.createdAt)}</div>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Eye className="h-4 w-4 mr-2" />
                <div>
                  <div className="font-medium">조회수</div>
                  <div>{post.view_count}</div>
                </div>
              </div>
              {post.church && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building className="h-4 w-4 mr-2" />
                  <div>
                    <div className="font-medium">교회</div>
                    <div>{post.church}</div>
                  </div>
                </div>
              )}
              {post.location && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <div>
                    <div className="font-medium">지역</div>
                    <div>{post.location}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 이미지와 연락처 */}
        <div className="space-y-6">
          {/* 이미지 섹션 */}
          {post.images && post.images.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">이미지</h3>
              </div>
              
              {/* 메인 이미지 */}
              <div className="p-4">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                  <img 
                    src={post.images[currentImageIndex]} 
                    alt={post.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleImageClick(currentImageIndex)}
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<div class="flex flex-col items-center justify-center text-gray-400 h-full"><div class="text-4xl mb-2">🖼️</div><span>이미지 로딩 실패</span></div>';
                      }
                    }}
                  />
                </div>
                
                {/* 썸네일 */}
                {post.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {post.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${post.title} ${index + 1}`}
                        className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                          currentImageIndex === index ? 'border-blue-500' : 'border-transparent'
                        } hover:border-blue-500`}
                        onClick={() => setCurrentImageIndex(index)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 연락처 정보 */}
          {(post.contactInfo || post.email) && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">연락처 정보</h3>
              </div>
              <div className="p-4 space-y-3">
                {post.contactInfo && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-3 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">연락처</div>
                      <div className="text-blue-600">{post.contactInfo}</div>
                    </div>
                  </div>
                )}
                {post.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-3 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900">이메일</div>
                      <div className="text-blue-600">{post.email}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 통계 */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">통계</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm text-gray-600">
                  <Eye className="h-4 w-4 mr-2" />
                  조회수
                </span>
                <span className="font-semibold text-gray-900">{post.view_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-sm text-gray-600">
                  <Heart className="h-4 w-4 mr-2" />
                  좋아요
                </span>
                <span className="font-semibold text-gray-900">{post.likes || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 상세보기 모달 */}
      {selectedImageIndex !== null && post.images && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={closeImageModal}>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img
              src={post.images[currentImageIndex]}
              alt={`${post.title} ${currentImageIndex + 1}`}
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
            {post.images.length > 1 && (
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
              {currentImageIndex + 1} / {post.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPostDetail;