import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Calendar, ExternalLink, Trash2 } from 'lucide-react';
import { supabaseApiService } from '../../services/supabaseApiService';
import { useToast } from '../../contexts/ToastContext';
import CommunityPagination from '../common/CommunityPagination';

interface WishlistItem {
  id: number;
  post_type: string;
  post_id: number;
  post_title: string;
  post_description: string;
  post_image_url: string | null;
  created_at: string;
}

interface WishlistData {
  items: WishlistItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const Wishlists: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [wishlists, setWishlists] = useState<WishlistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // 게시물 타입별 한글 이름 매핑
  const getPostTypeName = (postType: string): string => {
    const typeMap: { [key: string]: string } = {
      'community-sharing': '무료나눔',
      'sharing-offer': '물품판매',
      'item-request': '물품요청',
      'job-posting': '사역자모집',
      'music-team-recruit': '행사팀모집',
      'music-team-seeking': '행사팀지원',
      'church-events': '행사소식'
    };
    return typeMap[postType] || postType;
  };

  // 게시물 상세 페이지로 이동
  const navigateToPost = (item: WishlistItem) => {
    const routeMap: { [key: string]: string } = {
      'community-sharing': '/community/free-sharing',
      'sharing-offer': '/community/sharing-offer',
      'item-request': '/community/item-request',
      'job-posting': '/community/job-posting',
      'music-team-recruit': '/community/music-team-recruit',
      'music-team-seeking': '/community/music-team-seeking',
      'church-events': '/community/church-events'
    };

    const basePath = routeMap[item.post_type];
    if (basePath) {
      navigate(`${basePath}/${item.post_id}`);
    }
  };

  // 찜하기 제거
  const removeFromWishlist = async (item: WishlistItem) => {
    try {
      await supabaseApiService.wishlists.removeFromWishlist({
        post_type: item.post_type,
        post_id: item.post_id
      });

      showToast('찜하기에서 제거되었습니다.', 'success');
      fetchWishlists(currentPage); // 목록 새로고침
    } catch (error) {
      console.error('찜하기 제거 실패:', error);
      showToast('찜하기 제거에 실패했습니다.', 'error');
    }
  };

  // 찜한 글 목록 조회
  const fetchWishlists = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const data = await supabaseApiService.wishlists.getWishlists(page, 12);
      setWishlists(data);
    } catch (error) {
      console.error('찜한 글 조회 실패:', error);
      setError('찜한 글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlists(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">찜한 글을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchWishlists(currentPage)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">내가 찜한 글</h1>
          </div>
          <p className="text-gray-600">
            관심있는 게시물들을 한 곳에서 확인하세요
          </p>
        </div>

        {/* 통계 정보 */}
        {wishlists && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  총 {wishlists.pagination.total}개의 찜한 글이 있습니다
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {wishlists.pagination.page} / {wishlists.pagination.totalPages} 페이지
              </div>
            </div>
          </div>
        )}

        {/* 찜한 글 목록 */}
        {wishlists && wishlists.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlists.items.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                  {/* 이미지 */}
                  <div className="aspect-video bg-gray-100 relative">
                    {item.post_image_url ? (
                      <img
                        src={item.post_image_url}
                        alt={item.post_title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="flex items-center justify-center h-full text-gray-400"><div class="text-center"><div class="text-4xl mb-2">🖼️</div><span class="text-sm">이미지 없음</span></div></div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🖼️</div>
                          <span className="text-sm">이미지 없음</span>
                        </div>
                      </div>
                    )}

                    {/* 게시물 타입 배지 */}
                    <div className="absolute top-2 left-2">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {getPostTypeName(item.post_type)}
                      </span>
                    </div>

                    {/* 찜하기 제거 버튼 */}
                    <button
                      onClick={() => removeFromWishlist(item)}
                      className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
                      title="찜하기 제거"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>

                  {/* 콘텐츠 */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.post_title}
                    </h3>

                    {item.post_description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.post_description}
                      </p>
                    )}

                    {/* 메타 정보 */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>찜한 날짜: {formatDate(item.created_at)}</span>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <button
                      onClick={() => navigateToPost(item)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      게시물 보기
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {wishlists.pagination.totalPages > 1 && (
              <div className="mt-8">
                <CommunityPagination
                  pagination={{
                    current_page: wishlists.pagination.page,
                    total_pages: wishlists.pagination.totalPages,
                    total_count: wishlists.pagination.total,
                    per_page: wishlists.pagination.limit,
                    has_next: wishlists.pagination.page < wishlists.pagination.totalPages,
                    has_prev: wishlists.pagination.page > 1
                  }}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        ) : (
          /* 빈 상태 */
          <div className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              아직 찜한 글이 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              마음에 드는 게시물을 찜해보세요!
            </p>
            <button
              onClick={() => navigate('/community')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              커뮤니티 둘러보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlists;