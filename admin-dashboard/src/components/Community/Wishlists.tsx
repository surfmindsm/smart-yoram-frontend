import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, Trash2, Image as ImageIcon, MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { CommunityTable, TableColumn, TableRenderers } from '../common/CommunityTable';
import { supabaseApiService } from '../../services/supabaseApiService';
import { useToast } from '../../contexts/ToastContext';
import { formatCreatedAt } from '../../utils/dateUtils';
import CustomSelect, { SelectOption } from '../common/CustomSelect';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPostType, setSelectedPostType] = useState('all');

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

  // 게시물 타입 필터 옵션
  const postTypeOptions: SelectOption[] = [
    { value: 'all', label: '전체 타입' },
    { value: 'community-sharing', label: '무료나눔' },
    { value: 'sharing-offer', label: '물품판매' },
    { value: 'item-request', label: '물품요청' },
    { value: 'job-posting', label: '사역자모집' },
    { value: 'music-team-recruit', label: '행사팀모집' },
    { value: 'music-team-seeking', label: '행사팀지원' },
    { value: 'church-events', label: '행사소식' }
  ];

  // 찜한 글 목록 조회
  const fetchWishlists = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const data = await supabaseApiService.wishlists.getWishlists(page, 20);
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

  // 필터링된 아이템들
  const filteredItems = wishlists?.items.filter(item => {
    const matchesSearch = (item.post_title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.post_description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesPostType = selectedPostType === 'all' || item.post_type === selectedPostType;

    return matchesSearch && matchesPostType;
  }) || [];

  // 테이블 컬럼 정의
  const columns: TableColumn[] = [
    {
      key: 'post_title',
      title: '제목',
      render: (_, item) => TableRenderers.titleWithImage(
        item.post_title,
        item.post_image_url,
        <ImageIcon className="h-6 w-6 text-gray-400" />
      )
    },
    {
      key: 'post_type',
      title: '카테고리',
      render: (value) => TableRenderers.badge(getPostTypeName(value))
    },
    {
      key: 'post_description',
      title: '설명',
      render: (value) => (
        <span className="text-sm text-gray-600 line-clamp-2">
          {value || '-'}
        </span>
      )
    },
    {
      key: 'created_at',
      title: '찜한 날짜',
      render: (value) => TableRenderers.date(formatCreatedAt(value))
    },
    {
      key: 'actions',
      title: '작업',
      render: (_, item) => (
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            removeFromWishlist(item);
          }}
          className="text-red-600 hover:text-red-700"
          title="찜하기 해제"
        >
          <Heart className="h-4 w-4 fill-current" />
        </Button>
      )
    }
  ];

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
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end pr-6 mb-4">
        <div className="flex-1 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">내가 찜한 글</h1>
          <p className="text-sm text-gray-600">관심있는 게시물들을 한 곳에서 확인하세요</p>
        </div>

        <div className="flex items-center gap-3">
          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* 필터들 */}
      <div className="mb-4 flex gap-4">
        {/* 게시물 타입 선택 */}
        <CustomSelect
          options={postTypeOptions}
          value={selectedPostType}
          onChange={setSelectedPostType}
          className="w-auto"
        />
      </div>

      <CommunityTable
        columns={columns}
        data={filteredItems}
        loading={loading}
        onRowClick={navigateToPost}
        emptyMessage="찜한 글이 없습니다"
        emptyIcon={<Heart className="h-12 w-12 text-gray-400" />}
        selectable={false}
      />
    </div>
  );
};

export default Wishlists;