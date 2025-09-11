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
  type: 'free-sharing' | 'item-request' | 'sharing-offer' | 'job-posting' | 'job-seeking' | 'music-team-recruit' | 'music-team-seeking' | 'church-events';
  title: string;
  status: string;
  createdAt: string;
  views: number;
  likes: number;
  comments?: number;
  church?: string;
  location?: string;
}

const MyPosts: React.FC = () => {
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [editingPost, setEditingPost] = useState<MyPost | null>(null);

  const postTypes = [
    { value: 'all', label: '전체' },
    { value: 'free-sharing', label: '무료 나눔' },
    { value: 'item-request', label: '물품 요청' },
    { value: 'sharing-offer', label: '나눔 제공' },
    { value: 'job-posting', label: '구인 공고' },
    { value: 'job-seeking', label: '구직 신청' },
    { value: 'music-team-recruit', label: '음악팀 모집' },
    { value: 'music-team-seeking', label: '음악팀 참여' },
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
      setPosts(data);
    } catch (error) {
      console.error('내 게시글 조회 실패:', error);
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
        case 'free-sharing':
          await communityService.deleteSharingItem(post.id);
          break;
        case 'item-request':
          await communityService.deleteRequestItem(post.id);
          break;
        case 'sharing-offer':
          await communityService.deleteOfferItem(post.id);
          break;
        case 'job-posting':
          await communityService.deleteJobPost(post.id);
          break;
        case 'job-seeking':
          await communityService.deleteJobSeeker(post.id);
          break;
        case 'music-team-recruit':
          await communityService.deleteMusicRecruitment(post.id);
          break;
        case 'music-team-seeking':
          await communityService.deleteMusicSeeker(post.id);
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
      case 'free-sharing':
        return { icon: Gift, color: 'text-green-600', bg: 'bg-green-50', label: '무료 나눔' };
      case 'item-request':
        return { icon: HandHeart, color: 'text-blue-600', bg: 'bg-blue-50', label: '물품 요청' };
      case 'sharing-offer':
        return { icon: Share2, color: 'text-purple-600', bg: 'bg-purple-50', label: '나눔 제공' };
      case 'job-posting':
        return { icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50', label: '구인 공고' };
      case 'job-seeking':
        return { icon: UserIcon, color: 'text-cyan-600', bg: 'bg-cyan-50', label: '구직 신청' };
      case 'music-team-recruit':
        return { icon: Music, color: 'text-pink-600', bg: 'bg-pink-50', label: '음악팀 모집' };
      case 'music-team-seeking':
        return { icon: Music, color: 'text-indigo-600', bg: 'bg-indigo-50', label: '음악팀 참여' };
      case 'church-events':
        return { icon: Calendar, color: 'text-yellow-600', bg: 'bg-yellow-50', label: '교회 행사' };
      default:
        return { icon: Users, color: 'text-gray-600', bg: 'bg-gray-50', label: '기타' };
    }
  };

  const getStatusColor = (status: string, type: string) => {
    // 타입별로 상태에 따른 색상 결정
    switch (status) {
      case 'available':
      case 'requesting':
      case 'open':
      case 'active':
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'reserved':
      case 'matching':
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
      case 'closed':
      case 'inactive':
      case 'answered':
        return 'bg-gray-100 text-gray-800';
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
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const typeInfo = getTypeInfo(post.type);
            const IconComponent = typeInfo.icon;
            
            return (
              <div key={`${post.type}-${post.id}`} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${typeInfo.bg}`}>
                        <IconComponent className={`h-4 w-4 ${typeInfo.color}`} />
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status, post.type)}`}>
                        {post.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>

                    <div className="flex items-center text-sm text-gray-500 space-x-4 mb-3">
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.createdAt}
                      </span>
                      {post.church && (
                        <span>{post.church}</span>
                      )}
                      {post.location && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {post.location}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {post.views}
                      </span>
                      <span className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {post.likes}
                      </span>
                      {post.comments !== undefined && (
                        <span className="flex items-center">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.comments}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(post)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
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