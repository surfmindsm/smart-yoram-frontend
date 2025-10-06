import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
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
  Tag,
  MessageCircle
} from 'lucide-react';
import { Button } from "../ui";
import { Spinner } from "../ui/spinner";
import { formatCreatedAt } from '../../utils/dateUtils';
import { supabase } from '../../lib/supabase';
import { supabaseApiService } from '../../services/supabaseApiService';

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
  church_id?: number;
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [churchInfo, setChurchInfo] = useState<any>(null);
  const [loadingChurch, setLoadingChurch] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { showToast } = useToast();

  // 이미지가 필요 없는 게시물 타입들
  const noImagePostTypes = ['item-request', 'job-posting', 'music-team-recruit'];
  const shouldShowImages = !noImagePostTypes.includes(post.type) && post.images && post.images.length > 0;

  const copyToClipboard = (text: string, type: string) => {
    const copyMessages: { [key: string]: string } = {
      '전화번호': '전화번호가 복사되었습니다',
      '이메일': '이메일이 복사되었습니다',
      '주소': '주소가 복사되었습니다',
      '연락처': '연락처가 복사되었습니다'
    };

    navigator.clipboard.writeText(text).then(() => {
      showToast(copyMessages[type] || '복사되었습니다', 'success');
    }).catch(() => {
      showToast('복사에 실패했습니다', 'error');
    });
  };

  // 찜하기 상태 확인
  const checkWishlistStatus = async () => {
    if (!post) return;

    try {
      const status = await supabaseApiService.wishlists.checkWishlistStatus(post.type, post.id);
      setIsWishlisted(status);
    } catch (error) {
      console.error('찜 상태 확인 실패:', error);
    }
  };

  // 찜하기 토글
  const handleWishlistToggle = async () => {
    if (!post || wishlistLoading) return;

    setWishlistLoading(true);
    try {
      if (isWishlisted) {
        // 찜하기 제거
        await supabaseApiService.wishlists.removeFromWishlist({
          post_type: post.type,
          post_id: post.id
        });
        setIsWishlisted(false);
        showToast('찜하기에서 제거되었습니다', 'success');
      } else {
        // 찜하기 추가
        await supabaseApiService.wishlists.addToWishlist({
          post_type: post.type,
          post_id: post.id,
          post_title: post.title,
          post_description: post.description,
          post_image_url: shouldShowImages && post.images && post.images.length > 0 ? post.images[0] : undefined
        });
        setIsWishlisted(true);
        showToast('찜하기에 추가되었습니다', 'success');
      }
    } catch (error) {
      console.error('찜하기 처리 실패:', error);
      showToast('찜하기 처리에 실패했습니다', 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  // 컴포넌트 마운트 시 찜하기 상태 확인
  useEffect(() => {
    checkWishlistStatus();
  }, [post]);

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

  // 교회 정보 가져오기
  const fetchChurchInfo = async (churchId: number) => {
    if (loadingChurch || churchInfo?.id === churchId) return;

    console.log('🏛️ [교회 정보 조회] 시작 - churchId:', churchId);

    try {
      setLoadingChurch(true);
      const { data, error } = await supabase
        .from('churches')
        .select('id, name, phone, email, address')
        .eq('id', churchId)
        .single();

      console.log('🏛️ [교회 정보 조회] 응답:', { data, error });

      if (error) {
        console.error('🏛️ [교회 정보 조회] 에러:', error);
        throw error;
      }

      console.log('🏛️ [교회 정보 조회] 성공:', data);
      setChurchInfo(data);
    } catch (error) {
      console.error('🏛️ [교회 정보 조회] 최종 실패:', error);
      setChurchInfo(null);
    } finally {
      setLoadingChurch(false);
    }
  };

  // 문의하기 모달 열기 시 교회 정보 가져오기
  const handleContactModalOpen = () => {
    console.log('💬 [문의하기 모달] 열기 - post 데이터:', {
      church: post.church,
      church_id: post.church_id,
      type: post.type,
      id: post.id
    });

    setShowContactModal(true);
    if (post.church_id && post.church_id !== 9998) {
      console.log('💬 [문의하기 모달] 교회 정보 요청 - church_id:', post.church_id);
      fetchChurchInfo(post.church_id);
    } else {
      console.log('💬 [문의하기 모달] 교회 정보 요청 안함 - church_id:', post.church_id);
    }
  };

  const getStatusLabel = (status: string, type: string): string => {
    const statusLower = status.toLowerCase();

    // 무료나눔 상태
    if (type === 'free-sharing' || type === 'community-sharing') {
      switch (statusLower) {
        case 'active':
          return '나눔 가능';
        case 'ing':
          return '예약중';
        case 'completed':
          return '나눔 완료';
        default:
          return status;
      }
    }

    // 물품판매 상태
    if (type === 'item-sale') {
      switch (statusLower) {
        case 'active':
          return '판매중';
        case 'ing':
          return '예약중';
        case 'completed':
        case 'sold':
          return '판매 완료';
        default:
          return status;
      }
    }

    // 기타 상태
    switch (statusLower) {
      case 'active':
      case 'available':
        return '진행중';
      case 'requesting':
        return '요청중';
      case 'open':
        return '모집중';
      case 'upcoming':
        return '예정';
      case 'closed':
      case 'inactive':
        return '종료';
      case 'answered':
        return '답변완료';
      case 'cancelled':
        return '취소';
      case 'reserved':
        return '예약됨';
      case 'matching':
        return '매칭중';
      case 'ongoing':
        return '진행중';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
      case 'active':
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'ing':
      case 'reserved':
      case 'matching':
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
      case 'sold':
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
          <Spinner size="default" />
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
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
      </div>

      {/* 메인 콘텐츠 - 상품 스타일 레이아웃 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* 상단: 이미지 + 기본 정보 */}
        <div className={`grid ${shouldShowImages ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'} gap-8 p-6`}>
          {/* 왼쪽: 이미지 섹션 (특정 타입에서는 숨김) */}
          {shouldShowImages && (
            <div className="space-y-4">
              {post.images && post.images.length > 0 ? (
                <>
                  {/* 메인 이미지 */}
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={post.images[currentImageIndex]}
                      alt={post.title}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => handleImageClick(currentImageIndex)}
                      onError={(e) => {
                        const target = e.currentTarget;
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="flex flex-col items-center justify-center text-gray-400 h-full"><div class="text-4xl mb-2">🖼️</div><span class="text-sm">이미지 로딩 실패</span></div>';
                        }
                      }}
                    />
                  </div>

                  {/* 썸네일 */}
                  {post.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {post.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`${post.title} ${index + 1}`}
                          className={`w-20 h-20 object-cover rounded cursor-pointer border-2 flex-shrink-0 ${
                            currentImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                          } hover:border-blue-500 transition-colors`}
                          onClick={() => setCurrentImageIndex(index)}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-2">🖼️</div>
                    <span>이미지 없음</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 오른쪽: 기본 정보 */}
          <div className="space-y-6">
            {/* 카테고리와 상태 */}
            <div className="flex items-center gap-2 flex-wrap">
              {post.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Tag className="h-3 w-3 mr-1" />
                  {post.category}
                </span>
              )}
              {post.status && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(post.status)}`}>
                  {getStatusLabel(post.status, post.type)}
                </span>
              )}
            </div>

            {/* 제목 */}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {post.title}
            </h1>

            {/* 가격 (있는 경우) */}
            {post.price && (
              <div className="text-3xl font-bold text-blue-600">
                {typeof post.price === 'number'
                  ? `${post.price.toLocaleString()}원`
                  : post.price
                }
              </div>
            )}

            {/* 메타 정보 */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                <span>{post.likes || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{post.view_count || post.views || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatCreatedAt(post.created_at || post.createdAt)}</span>
              </div>
            </div>

            {/* 추가 필드들 */}
            {fieldMappings.length > 0 && (
              <div className="space-y-3">
                {fieldMappings.map((field, index) => {
                  const value = post[field.key];
                  // 배열 타입의 경우 빈 배열도 빈 값으로 처리
                  const isEmpty = !value || (Array.isArray(value) && value.length === 0);
                  const displayValue = !isEmpty ? renderFieldValue(field, value, post) : '-';

                  return (
                    <div key={index} className="py-2 border-b border-gray-100 last:border-b-0">
                      <div className="text-sm font-medium text-gray-500 mb-1">
                        {field.label}
                      </div>
                      <div className="text-sm text-gray-900">
                        {displayValue}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 위치 및 교회 정보 */}
            {(post.church || post.location) && (
              <div className="space-y-2">
                {post.church && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{post.church}</span>
                  </div>
                )}
                {post.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>{post.location}</span>
                  </div>
                )}
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex gap-3">
              {/* 찜하기 버튼 */}
              <Button
                variant="outline"
                className={`flex-1 flex items-center justify-center gap-2 transition-colors ${
                  isWishlisted
                    ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                }`}
                onClick={handleWishlistToggle}
                disabled={wishlistLoading}
              >
                <Heart
                  className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`}
                />
                {wishlistLoading ? '처리중...' : isWishlisted ? '찜 해제' : '찜하기'}
              </Button>

              {/* 문의하기 버튼 */}
              <Button
                className="flex-1 flex items-center justify-center gap-2"
                onClick={handleContactModalOpen}
                disabled={post.status === 'completed' || post.status === 'sold'}
              >
                <MessageCircle className="h-4 w-4" />
                문의하기
              </Button>
            </div>

            {/* 연락처 정보 */}
            {(post.contactInfo || post.email) && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <h3 className="font-semibold text-gray-900">연락처 정보</h3>
                {post.contactInfo && (
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-3 text-blue-600 flex-shrink-0" />
                    <span className="text-blue-600 break-all">{post.contactInfo}</span>
                  </div>
                )}
                {post.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-3 text-blue-600 flex-shrink-0" />
                    <span className="text-blue-600 break-all">{post.email}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 하단: 상세 설명 */}
        <div className="border-t bg-gray-50 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">상세 설명</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {post.description}
            </p>
          </div>
        </div>

        {/* 포트폴리오 섹션 - 행사팀 지원 글에만 표시 */}
        {(() => {
          if (post.type === 'music-team-seeking') {
            console.log('🔍 [DEBUG] 상세페이지 portfolioFile:', post.portfolioFile);
            console.log('🔍 [DEBUG] 상세페이지 portfolio:', post.portfolio);
          }
          return null;
        })()}
        {post.type === 'music-team-seeking' && (post.portfolio || post.portfolioFile) && (
          <div className="border-t bg-white p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              포트폴리오
            </h2>
            <div className="space-y-4">
              {/* YouTube 영상 */}
              {post.portfolio && (() => {
                // 유튜브 URL인지 확인
                const isYouTubeUrl = (url: string) => {
                  return /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/.test(url);
                };

                // 유튜브 비디오 ID 추출
                const extractYouTubeId = (url: string) => {
                  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
                  return match ? match[1] : null;
                };

                const fullUrl = post.portfolio.startsWith('http') ? post.portfolio : `https://${post.portfolio}`;

                if (isYouTubeUrl(fullUrl)) {
                  const videoId = extractYouTubeId(fullUrl);
                  if (videoId) {
                    return (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">연주 영상</h3>
                        <div className="relative rounded-lg overflow-hidden shadow-lg bg-black aspect-video">
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="포트폴리오 영상"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                      </div>
                    );
                  }
                }

                // 유튜브가 아닌 경우 기존 링크 방식
                return (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">🔗 포트폴리오 링크</h3>
                    <a
                      href={fullUrl}
                      className="text-blue-600 hover:underline inline-flex items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {post.portfolio}
                    </a>
                  </div>
                );
              })()}

              {/* 파일 다운로드 */}
              {post.portfolioFile && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">포트폴리오 파일</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          📄
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {(() => {
                              try {
                                if (post.portfolioFile.startsWith('data:application/json;charset=utf-8,')) {
                                  // 새로운 청크 방식에서 파일명 추출
                                  const encodedData = post.portfolioFile.split(',')[1];
                                  const combinedData = JSON.parse(decodeURIComponent(encodedData));
                                  return combinedData.metadata?.originalName || '포트폴리오 파일';
                                } else if (post.portfolioFile.startsWith('data:application/json;base64,')) {
                                  // 기존 Base64 JSON에서 파일명 추출
                                  const base64Data = post.portfolioFile.split(',')[1];
                                  const fileInfo = JSON.parse(atob(base64Data));
                                  return fileInfo.originalName || '포트폴리오 파일';
                                } else {
                                  // 기존 URL 방식
                                  const fileName = post.portfolioFile.split('/').pop();
                                  if (fileName && fileName.includes('_')) {
                                    const originalName = fileName.split('_').slice(1).join('_');
                                    return originalName.replace(/_/g, ' ') || '포트폴리오 파일';
                                  }
                                  return fileName || '포트폴리오 파일';
                                }
                              } catch (error) {
                                return '포트폴리오 파일';
                              }
                            })()}
                          </p>
                          <p className="text-xs text-gray-500">첨부된 포트폴리오 자료</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          try {
                            if (post.portfolioFile.startsWith('data:application/json;charset=utf-8,')) {
                              // 새로운 청크 방식 처리
                              const encodedData = post.portfolioFile.split(',')[1];
                              const combinedData = JSON.parse(decodeURIComponent(encodedData));

                              if (combinedData.metadata && combinedData.chunks) {
                                // 청크를 재결합하여 원본 Base64 데이터 복원
                                const fullBase64 = combinedData.chunks.join('');

                                // Base64 데이터를 Blob으로 변환
                                const byteCharacters = atob(fullBase64);
                                const byteNumbers = new Array(byteCharacters.length);
                                for (let i = 0; i < byteCharacters.length; i++) {
                                  byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                const byteArray = new Uint8Array(byteNumbers);
                                const blob = new Blob([byteArray], { type: combinedData.metadata.mimeType });

                                // 다운로드 링크 생성
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = combinedData.metadata.originalName;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              }
                            } else if (post.portfolioFile.startsWith('data:application/json;base64,')) {
                              // 기존 Base64 JSON 파일 정보에서 실제 파일 다운로드
                              const base64Data = post.portfolioFile.split(',')[1];
                              const fileInfo = JSON.parse(atob(base64Data));

                              // Base64 데이터를 Blob으로 변환
                              const byteCharacters = atob(fileInfo.fileBase64);
                              const byteNumbers = new Array(byteCharacters.length);
                              for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                              }
                              const byteArray = new Uint8Array(byteNumbers);
                              const blob = new Blob([byteArray], { type: fileInfo.mimeType });

                              // 다운로드 링크 생성
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = fileInfo.originalName;
                              document.body.appendChild(a);
                              a.click();
                              window.URL.revokeObjectURL(url);
                              document.body.removeChild(a);
                            } else if (post.portfolioFile.startsWith('data:')) {
                              // 직접 Base64 데이터 URL
                              const a = document.createElement('a');
                              a.href = post.portfolioFile;
                              a.download = '포트폴리오_파일';
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            } else {
                              // 기존 URL 방식
                              window.open(post.portfolioFile, '_blank');
                            }
                          } catch (error) {
                            console.error('파일 다운로드 실패:', error);
                            alert('파일 다운로드에 실패했습니다.');
                          }
                        }}
                        size="sm"
                        className="text-blue-600 bg-blue-50 hover:bg-blue-100"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        다운로드
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
            <Button
              onClick={closeImageModal}
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full h-10 w-10 p-0"
            >
              <X className="h-6 w-6" />
            </Button>
            
            {/* 네비게이션 버튼들 */}
            {post.images.length > 1 && (
              <>
                <Button
                  onClick={() => navigateImage('prev')}
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full h-10 w-10 p-0"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  onClick={() => navigateImage('next')}
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full h-10 w-10 p-0"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {/* 이미지 카운터 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
              {currentImageIndex + 1} / {post.images.length}
            </div>
          </div>
        </div>
      )}

      {/* 교회 연락처 문의 모달 */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowContactModal(false)}>
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">교회 문의하기</h3>
              <Button
                onClick={() => setShowContactModal(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6 space-y-4">
              {/* 교회 정보 */}
              {post.church && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Building className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-blue-900">{post.church}</h4>
                    {loadingChurch && (
                      <div className="ml-2 text-xs text-blue-600">연락처 조회 중...</div>
                    )}
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    이 게시물을 올린 교회입니다. 아래 연락처로 문의해 주세요.
                  </p>

                  {/* 교회 연락처 정보 */}
                  <div className="space-y-2">

                    {/* 실제 교회 전화번호 */}
                    {churchInfo?.phone ? (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                        <span className="text-blue-800 flex-1">
                          {churchInfo.phone}
                        </span>
                        <Button
                          onClick={() => copyToClipboard(churchInfo.phone, '전화번호')}
                          variant="outline"
                          size="sm"
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800 border-blue-300 h-6 px-2"
                        >
                          복사
                        </Button>
                      </div>
                    ) : !loadingChurch && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>전화번호 정보 없음</span>
                      </div>
                    )}

                    {/* 실제 교회 이메일 */}
                    {churchInfo?.email ? (
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                        <span className="text-blue-800 break-all flex-1">
                          {churchInfo.email}
                        </span>
                        <Button
                          onClick={() => copyToClipboard(churchInfo.email, '이메일')}
                          variant="outline"
                          size="sm"
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800 border-blue-300 h-6 px-2"
                        >
                          복사
                        </Button>
                      </div>
                    ) : !loadingChurch && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>이메일 정보 없음</span>
                      </div>
                    )}

                    {/* 교회 주소 (있는 경우) */}
                    {churchInfo?.address && (
                      <div className="flex items-start text-sm">
                        <MapPin className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-800 flex-1">
                          {churchInfo.address}
                        </span>
                        <Button
                          onClick={() => copyToClipboard(churchInfo.address, '주소')}
                          variant="outline"
                          size="sm"
                          className="ml-2 text-xs text-blue-600 hover:text-blue-800 border-blue-300 h-6 px-2"
                        >
                          복사
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 게시물 작성자 연락처 */}
              {(post.contactInfo || post.email) && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">작성자 연락처</h4>

                  {post.contactInfo && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Phone className="h-4 w-4 text-blue-600 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">전화번호</div>
                        <div className="text-blue-600 font-medium">{post.contactInfo}</div>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(post.contactInfo!, '연락처')}
                        variant="outline"
                        size="sm"
                        className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
                      >
                        복사
                      </Button>
                    </div>
                  )}

                  {post.email && (
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <Mail className="h-4 w-4 text-blue-600 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">이메일</div>
                        <div className="text-blue-600 font-medium break-all">{post.email}</div>
                      </div>
                      <Button
                        onClick={() => copyToClipboard(post.email!, '이메일')}
                        variant="outline"
                        size="sm"
                        className="text-xs text-gray-500 hover:text-gray-700 h-6 px-2"
                      >
                        복사
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* 게시물 정보 */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">문의 게시물</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">{post.title}</div>
                  {post.category && (
                    <div className="text-xs text-gray-500 mt-1">{post.category}</div>
                  )}
                </div>
              </div>

              {/* 안내 메시지 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-yellow-800">
                  <strong>문의 시 주의사항:</strong>
                  <ul className="mt-1 ml-4 list-disc text-xs space-y-1">
                    <li>정중하고 예의 바른 언어를 사용해 주세요</li>
                    <li>구체적인 문의 내용을 명시해 주세요</li>
                    <li>개인정보 보호에 유의해 주세요</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 모달 하단 */}
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <Button
                variant="outline"
                onClick={() => setShowContactModal(false)}
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPostDetail;