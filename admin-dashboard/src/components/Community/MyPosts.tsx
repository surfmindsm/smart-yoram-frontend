import React, { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
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
  Users
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService } from '../../services/communityService';

// 사용자의 모든 게시글을 위한 통합 인터페이스
interface MyPost {
  id: number;
  type: string; // API 응답에 따라 다양한 타입이 올 수 있음
  title: string;
  status: string;
  created_at: string;
  view_count: number;
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

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return '오늘';
      } else if (diffDays === 1) {
        return '어제';
      } else if (diffDays < 7) {
        return `${diffDays}일 전`;
      } else {
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (error) {
      return dateString;
    }
  };

  const postTypes = [
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

      // abc.md 권장: 응답 검증 강화
      if (Array.isArray(data)) {
        // 알 수 없는 상태값 체크 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
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

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'community-sharing':
        return {
          icon: Gift,
          color: 'text-green-600',
          bg: 'bg-green-50',
          label: '무료 나눔',
          menu: '커뮤니티 > 무료 나눔'
        };
      case 'community-request':
        return {
          icon: HandHeart,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          label: '물품 요청',
          menu: '커뮤니티 > 물품 요청'
        };
      case 'job-posts':
        return {
          icon: Briefcase,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          label: '구인 공고',
          menu: '커뮤니티 > 구인 공고'
        };
      case 'job-seekers':
        return {
          icon: UserIcon,
          color: 'text-cyan-600',
          bg: 'bg-cyan-50',
          label: '구직 신청',
          menu: '커뮤니티 > 구직 신청'
        };
      case 'music-team-recruitment':
        return {
          icon: Music,
          color: 'text-pink-600',
          bg: 'bg-pink-50',
          label: '음악팀 모집',
          menu: '커뮤니티 > 음악팀 모집'
        };
      case 'music-team-seekers':
        return {
          icon: Music,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
          label: '음악팀 참여',
          menu: '커뮤니티 > 음악팀 참여'
        };
      case 'church-events':
        return {
          icon: Calendar,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          label: '교회 행사',
          menu: '커뮤니티 > 교회 행사'
        };
      case 'church-news':
        return {
          icon: Calendar,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          label: '교회 소식',
          menu: '커뮤니티 > 교회 소식'
        };
      default:
        return {
          icon: Users,
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          label: '기타',
          menu: '커뮤니티'
        };
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
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || post.type === selectedType;
    return matchesSearch && matchesType;
  });


  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">내가 올린 글</h1>
        <p className="text-gray-600">
          내가 작성한 모든 게시글을 관리할 수 있습니다.
        </p>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색창 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="제목으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 게시글 타입 선택 */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {postTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* 필터 버튼 */}
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            필터
          </Button>
        </div>
      </div>

      {/* 게시글 목록 */}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">내 게시글을 불러오는 중...</span>
        </div>
      ) : filteredPosts.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메뉴
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조회/좋아요
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPosts.map((post, index) => {
                  const typeInfo = getTypeInfo(post.type);
                  const IconComponent = typeInfo.icon;

                  return (
                    <tr key={`${post.type}-${post.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {typeInfo.menu.replace('커뮤니티 > ', '')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {post.title}
                        </div>
                        {post.location && (
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <MapPin className="h-3 w-3 mr-1" />
                            {post.location}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status, post.type)}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(post.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {post.view_count}
                          </span>
                          <span className="flex items-center">
                            <Heart className="h-4 w-4 mr-1" />
                            {post.likes}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleEdit(post)}
                            size="sm"
                            variant="outline"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDelete(post)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            작성한 게시글이 없습니다
          </h3>
          <p className="text-gray-600 mb-6">
            커뮤니티에 첫 번째 게시글을 작성해보세요!
          </p>
          <div className="flex justify-center space-x-3">
            <Button asChild>
              <a href="/community/free-sharing">무료 나눔 등록</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/community/item-request">물품 요청 등록</a>
            </Button>
          </div>
        </div>
      )}

      {/* 페이지네이션 (필요시 추후 구현) */}
      {filteredPosts.length > 10 && (
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>이전</Button>
            <Button size="sm">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline" size="sm">다음</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPosts;