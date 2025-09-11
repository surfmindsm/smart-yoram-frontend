import React, { useState, useEffect } from 'react';
import { 
  Search,
  Filter,
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
  AlertTriangle,
  Shield
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService } from '../../services/communityService';

// 관리자가 보는 모든 게시글 인터페이스
interface AdminPost {
  id: number;
  type: 'free-sharing' | 'item-request' | 'sharing-offer' | 'job-posting' | 'job-seeking' | 'music-team-recruit' | 'music-team-seeking' | 'church-events';
  title: string;
  status: string;
  createdAt: string;
  views: number;
  likes: number;
  comments?: number;
  church: string;
  location?: string;
  author: string; // 작성자 정보
  authorEmail?: string; // 작성자 이메일
}

const CommunityAdmin: React.FC = () => {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

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

  const statusOptions = [
    { value: 'all', label: '전체 상태' },
    { value: 'active', label: '활성' },
    { value: 'pending', label: '대기' },
    { value: 'reported', label: '신고됨' },
    { value: 'blocked', label: '차단됨' }
  ];

  useEffect(() => {
    fetchAllPosts();
  }, [selectedType, selectedStatus, searchTerm]);

  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      const data = await communityService.getAllPostsForAdmin({
        type: selectedType === 'all' ? undefined : selectedType,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        search: searchTerm || undefined,
        limit: 100
      });
      setPosts(data);
    } catch (error) {
      console.error('커뮤니티 게시글 조회 실패:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminDelete = async (post: AdminPost) => {
    if (!window.confirm(`정말 이 게시글을 삭제하시겠습니까?\n\n제목: ${post.title}\n작성자: ${post.author} (${post.church})`)) {
      return;
    }
    
    try {
      // 수퍼어드민 권한으로 강제 삭제
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

  const handleBlock = async (post: AdminPost) => {
    if (!window.confirm(`이 게시글을 차단하시겠습니까?\n\n제목: ${post.title}\n작성자: ${post.author} (${post.church})`)) {
      return;
    }
    
    try {
      await communityService.blockPost(post.type, post.id);
      
      // 성공하면 상태 변경
      setPosts(posts.map(p => 
        p.id === post.id ? { ...p, status: 'blocked' } : p
      ));
      alert('게시글이 차단되었습니다.');
    } catch (error) {
      console.error('게시글 차단 실패:', error);
      alert('게시글 차단에 실패했습니다.');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'available':
      case 'requesting':
      case 'open':
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reported':
        return 'bg-orange-100 text-orange-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.church.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || post.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900">커뮤니티 관리</h1>
        </div>
        <p className="text-gray-600">
          모든 커뮤니티 게시글을 관리하고 부적절한 콘텐츠를 차단할 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 게시글</p>
              <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">신고된 게시글</p>
              <p className="text-2xl font-bold text-orange-600">
                {posts.filter(p => p.status === 'reported').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">차단된 게시글</p>
              <p className="text-2xl font-bold text-red-600">
                {posts.filter(p => p.status === 'blocked').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">오늘 등록</p>
              <p className="text-2xl font-bold text-green-600">
                {posts.filter(p => p.createdAt.includes('시간 전') || p.createdAt.includes('분 전')).length}
              </p>
            </div>
            <Calendar className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 검색창 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="제목, 작성자, 교회명으로 검색..."
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
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            고급 필터
          </Button>
        </div>
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">게시글을 불러오는 중...</span>
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
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(post.status)}`}>
                        {post.status}
                      </span>
                      {post.status === 'reported' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          신고됨
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>

                    <div className="flex items-center text-sm text-gray-600 space-x-4 mb-3">
                      <span className="flex items-center font-medium">
                        <UserIcon className="h-4 w-4 mr-1" />
                        {post.author}
                      </span>
                      <span>{post.church}</span>
                      {post.location && (
                        <span className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {post.location}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {post.createdAt}
                      </span>
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

                  {/* 관리자 액션 버튼들 */}
                  <div className="flex items-center space-x-2 ml-4">
                    {post.status !== 'blocked' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlock(post)}
                        className="flex items-center gap-1 text-orange-600 hover:text-orange-700 hover:border-orange-300"
                      >
                        <Shield className="h-4 w-4" />
                        차단
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAdminDelete(post)}
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
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            표시할 게시글이 없습니다
          </h3>
          <p className="text-gray-600">
            검색 조건을 변경하거나 필터를 조정해보세요.
          </p>
        </div>
      )}

      {/* 페이지네이션 */}
      {filteredPosts.length > 20 && (
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

export default CommunityAdmin;