import React, { useState, useEffect } from 'react';
import {
  Search,
  Edit,
  Trash2,
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  MapPin,
  Clock,
  Gift,
  HandHeart,
  Share2,
  Briefcase,
  User as UserIcon,
  Music,
  Users,
  CheckCircle,
  RotateCcw
} from 'lucide-react';
import { Button } from "../ui";
import { PageContainer, PageHeader } from "../ui";
import { CommunityTable, TableColumn, TableRenderers } from '../common/CommunityTable';
import CustomSelect, { SelectOption } from '../common/CustomSelect';
import { communityService } from '../../services/communityService';
import { formatCreatedAt } from '../../utils/dateUtils';

// 사용자의 모든 게시글을 위한 통합 인터페이스
interface MyPost {
  id: number;
  type: string; // API 응답에 따라 다양한 타입이 올 수 있음
  title: string;
  status: string;
  created_at: string;
  view_count: number;
  views?: number; // 추가 조회수 필드
  viewCount?: number; // 추가 조회수 필드
  likes: number;
  comments?: number;
  church?: string;
  location?: string;
  author_name?: string; // 백엔드 표준화로 더 안정적으로 제공됨
}

const MyPosts: React.FC = () => {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [editingPost, setEditingPost] = useState<MyPost | null>(null);


  const postTypes: SelectOption[] = [
    { value: 'all', label: '전체' },
    { value: 'community-sharing', label: '무료 나눔' },
    { value: 'community-request', label: '물품 요청' },
    { value: 'job-posts', label: '구인 공고' },
    { value: 'job-seekers', label: '구직 신청' },
    { value: 'music-team-recruitment', label: '음악팀 모집' },
    { value: 'music-team-seekers', label: '음악팀 참여' },
    { value: 'church-news', label: '교회 소식' },
    { value: 'church-events', label: '교회 행사' }
  ];

  useEffect(() => {
    fetchMyPosts();
  }, [selectedType, searchTerm]);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const data = await communityService.getMyPosts({
        type: selectedType === 'all' ? undefined : selectedType,
        search: searchTerm || undefined,
        limit: 50
      });

      console.log('🔍 MyPosts API 응답 데이터:', data);
      console.log('🔍 첫 번째 게시글 상세:', data[0]);

      // abc.md 권장: 응답 검증 강화
      if (Array.isArray(data)) {
        // 조회수 필드 체크
        if (process.env.NODE_ENV === 'development') {
          const viewCountStats = data.map(post => ({
            id: post.id,
            type: post.type,
            title: post.title,
            view_count: post.view_count,
            views: post.views,
            viewCount: post.viewCount
          }));
          console.log('🔍 조회수 필드 상태:', viewCountStats);

          const unknownStatuses = data
            .map(post => post.status)
            .filter(status => !['active', 'completed', 'closed', 'cancelled', 'available', 'requesting', 'open', 'upcoming', 'reserved', 'matching', 'ongoing'].includes(status.toLowerCase()));

          if (unknownStatuses.length > 0) {
            console.warn('🔍 알 수 없는 상태값 발견:', unknownStatuses.filter((v, i, a) => a.indexOf(v) === i));
          }
        }

        setPosts(data);
      } else {
        console.error('❌ 예상치 못한 응답 형식:', data);
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ 내 게시글 조회 실패:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (post: MyPost) => {
    setEditingPost(post);
    // 해당 게시글 타입의 수정 페이지로 이동하거나 모달 열기
    const editPath = `/community/${post.type}/${post.id}/edit`;
    window.location.href = editPath;
  };

  const handleRead = (post: MyPost) => {
    // 게시글 상세 페이지로 이동
    const readPath = `/community/${post.type}/${post.id}`;
    window.location.href = readPath;
  };

  const handleDelete = async (post: MyPost) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      // API 호출하여 게시글 삭제
      switch (post.type) {
        case 'community-sharing':
          await communityService.deleteSharingItem(post.id);
          break;
        case 'community-request':
          await communityService.deleteRequestItem(post.id);
          break;
        case 'job-posts':
          await communityService.deleteJobPost(post.id);
          break;
        case 'job-seekers':
          await communityService.deleteJobSeeker(post.id);
          break;
        case 'music-team-recruitment':
          await communityService.deleteMusicRecruitment(post.id);
          break;
        case 'music-team-seekers':
          await communityService.deleteMusicSeeker(post.id);
          break;
        case 'church-news':
          await communityService.deleteChurchNews(post.id);
          break;
        case 'church-events':
          await communityService.deleteChurchEvent(post.id);
          break;
      }

      // 성공하면 목록에서 제거
      setPosts(posts.filter(p => p.id !== post.id));
      alert('게시글이 삭제되었습니다.');
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  const handleStatusChange = async (post: MyPost, newStatus: string) => {
    try {
      // 물품 관련 게시글의 상태 변경
      switch (post.type) {
        case 'community-sharing':
          await communityService.updateSharingItemStatus(post.id, newStatus);
          break;
        case 'item-sale':
          await communityService.updateOfferItemStatus(post.id, newStatus);
          break;
        default:
          alert('상태 변경이 지원되지 않는 게시글입니다.');
          return;
      }

      // 성공하면 목록 새로고침
      await fetchMyPosts();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'community-sharing':
        return {
          icon: Gift,
          color: 'text-green-600',
          bg: 'bg-green-50',
          label: '무료 나눔',
          menu: '무료 나눔(드림)',
          chipColor: 'bg-green-100 text-green-800'
        };
      case 'community-request':
        return {
          icon: HandHeart,
          color: 'text-primary-600',
          bg: 'bg-primary-50',
          label: '물품 요청',
          menu: '물품 요청',
          chipColor: 'bg-primary-100 text-primary-800'
        };
      case 'job-posts':
        return {
          icon: Briefcase,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          label: '구인 공고',
          menu: '사역자 모집',
          chipColor: 'bg-orange-100 text-orange-800'
        };
      case 'job-seekers':
        return {
          icon: UserIcon,
          color: 'text-cyan-600',
          bg: 'bg-cyan-50',
          label: '구직 신청',
          menu: '사역자 지원',
          chipColor: 'bg-cyan-100 text-cyan-800'
        };
      case 'music-team-recruitment':
        return {
          icon: Music,
          color: 'text-pink-600',
          bg: 'bg-pink-50',
          label: '음악팀 모집',
          menu: '행사팀 모집',
          chipColor: 'bg-pink-100 text-pink-800'
        };
      case 'music-team-seekers':
        return {
          icon: Music,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
          label: '음악팀 참여',
          menu: '행사팀 지원',
          chipColor: 'bg-indigo-100 text-indigo-800'
        };
      case 'church-events':
        return {
          icon: Calendar,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          label: '교회 행사',
          menu: '행사 소식',
          chipColor: 'bg-purple-100 text-purple-800'
        };
      case 'church-news':
        return {
          icon: Calendar,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          label: '교회 소식',
          menu: '교회 소식',
          chipColor: 'bg-yellow-100 text-yellow-800'
        };
      case 'item-sale':
        return {
          icon: Share2,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          label: '물품 판매',
          menu: '물품 판매',
          chipColor: 'bg-emerald-100 text-emerald-800'
        };
      default:
        return {
          icon: Users,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          label: '기타',
          menu: '기타',
          chipColor: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const getStatusLabel = (status: string, type: string): string => {
    const statusLower = status.toLowerCase();

    // 무료나눔 상태
    if (type === 'community-sharing') {
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

  const getStatusColor = (status: string, type: string) => {
    // 백엔드 표준화: active, completed, closed, cancelled 통일
    switch (status.toLowerCase()) {
      case 'active':
      case 'available': // 기존 호환성 유지
      case 'requesting':
      case 'open':
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'completed':
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      case 'closed':
      case 'inactive':
      case 'answered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'reserved':
      case 'matching':
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-primary-100 text-primary-800';
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || post.type === selectedType;
    return matchesSearch && matchesType;
  });

  const columns: TableColumn[] = [
    {
      key: 'type',
      title: '메뉴',
      render: (_, post) => {
        const typeInfo = getTypeInfo(post.type);
        return TableRenderers.badge(typeInfo.menu, typeInfo.chipColor);
      }
    },
    {
      key: 'title',
      title: '제목',
      render: (_, post) => (
        <div>
          <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
            {post.title}
          </div>
          {post.location && (
            <div className="text-xs text-gray-500 flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {post.location}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: '상태',
      render: (_, post) => TableRenderers.badge(getStatusLabel(post.status, post.type), getStatusColor(post.status, post.type))
    },
    {
      key: 'created_at',
      title: '작성일',
      render: (value) => TableRenderers.date(formatCreatedAt(value))
    },
    {
      key: 'view_count',
      title: '조회수',
      render: (_, post) => TableRenderers.viewCount(post.view_count || post.views || post.viewCount || 0)
    },
    {
      key: 'actions',
      title: '관리',
      render: (_, post) => {
        const isItemPost = post.type === 'community-sharing' || post.type === 'item-sale';
        const isCompleted = post.status === 'completed' || post.status === 'sold';

        return (
          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
            {isItemPost && (
              <select
                value={post.status}
                onChange={(e) => handleStatusChange(post, e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="active">
                  {post.type === 'community-sharing' ? '나눔 가능' : '판매중'}
                </option>
                <option value="ing">예약중</option>
                <option value="completed">
                  {post.type === 'community-sharing' ? '나눔 완료' : '판매 완료'}
                </option>
              </select>
            )}
            <Button
              onClick={() => handleEdit(post)}
              size="sm"
              variant="outline"
              className="text-primary-600 border-primary-200 hover:bg-primary-50"
            >
              <Edit className="h-4 w-4 mr-1" />
              수정
            </Button>
            <Button
              onClick={() => handleDelete(post)}
              size="sm"
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              삭제
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <PageContainer>
      <PageHeader
        title="내가 올린 글"
        description="내가 작성한 모든 게시글을 관리할 수 있습니다"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <CustomSelect
              options={postTypes}
              value={selectedType}
              onChange={setSelectedType}
              className="w-auto"
            />
          </div>
        }
      />

      <CommunityTable
        columns={columns}
        data={filteredPosts}
        loading={loading}
        onRowClick={handleRead}
        emptyMessage="작성한 게시글이 없습니다"
        emptyIcon={<UserIcon className="h-12 w-12 text-gray-400" />}
        selectable={false}
      />
    </PageContainer>
  );
};

export default MyPosts;