import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Gift, 
  HandHeart, 
  Share2, 
  Users2, 
  TrendingUp,
  Clock,
  MapPin
} from 'lucide-react';

const CommunityHome: React.FC = () => {
  // 임시 통계 데이터
  const stats = {
    totalPosts: 156,
    activeSharing: 43,
    completedSharing: 98,
    activeRequests: 15
  };

  // 최근 게시글 임시 데이터
  const recentPosts = [
    {
      id: 1,
      type: 'sharing',
      title: '유아용 의자와 책상 나눔합니다',
      church: '새빛교회',
      location: '서울 강남구',
      createdAt: '2시간 전',
      status: '나눔중'
    },
    {
      id: 2,
      type: 'request',
      title: '주일학교 교재 필요합니다',
      church: '은혜교회',
      location: '부산 해운대구',
      createdAt: '4시간 전',
      status: '요청중'
    },
    {
      id: 3,
      type: 'offer',
      title: '찬양용 기타 3대 제공 가능합니다',
      church: '평강교회',
      location: '대구 중구',
      createdAt: '6시간 전',
      status: '제공 가능'
    }
  ];

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'sharing':
        return { icon: Gift, color: 'text-green-600', bg: 'bg-green-50', label: '무료 나눔' };
      case 'request':
        return { icon: HandHeart, color: 'text-blue-600', bg: 'bg-blue-50', label: '물품 요청' };
      case 'offer':
        return { icon: Share2, color: 'text-purple-600', bg: 'bg-purple-50', label: '나눔 제공' };
      default:
        return { icon: Users2, color: 'text-gray-600', bg: 'bg-gray-50', label: '기타' };
    }
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">커뮤니티</h1>
        <p className="text-gray-600">
          전국 교회들과 함께 나누고, 필요한 것을 요청하며, 서로 도울 수 있는 공간입니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 게시글</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts}</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">진행 중인 나눔</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeSharing}</p>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Gift className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">완료된 나눔</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedSharing}</p>
            </div>
            <div className="h-12 w-12 bg-gray-50 rounded-lg flex items-center justify-center">
              <Users2 className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">활성 요청</p>
              <p className="text-2xl font-bold text-blue-600">{stats.activeRequests}</p>
            </div>
            <div className="h-12 w-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <HandHeart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 빠른 액션 카드 */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 시작</h2>
          <div className="space-y-4">
            <Link
              to="/community/free-sharing"
              className="block p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                  <Gift className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">무료 나눔</h3>
                  <p className="text-sm text-gray-600">사용하지 않는 물품을 나누어요</p>
                </div>
              </div>
            </Link>

            <Link
              to="/community/item-request"
              className="block p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                  <HandHeart className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">물품 요청</h3>
                  <p className="text-sm text-gray-600">필요한 물품을 요청해요</p>
                </div>
              </div>
            </Link>

            <Link
              to="/community/sharing-offer"
              className="block p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                  <Share2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">나눔 제공</h3>
                  <p className="text-sm text-gray-600">여분의 물품을 제공해요</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* 최근 게시글 */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 활동</h2>
            <Link to="/community/all" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              전체 보기 →
            </Link>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="divide-y">
              {recentPosts.map((post) => {
                const typeInfo = getTypeInfo(post.type);
                const IconComponent = typeInfo.icon;
                
                return (
                  <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${typeInfo.bg}`}>
                        <IconComponent className={`h-5 w-5 ${typeInfo.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeInfo.bg} ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {post.status}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {post.title}
                        </p>
                        <div className="flex items-center text-xs text-gray-500 mt-1 space-x-4">
                          <span>{post.church}</span>
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {post.location}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {post.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Users2 className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">커뮤니티 이용 안내</h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>• 모든 게시글은 교회 관리자의 승인 후 게시됩니다.</p>
              <p>• 상업적 목적의 게시글은 금지되며, 순수한 나눔 목적으로만 이용해 주세요.</p>
              <p>• 개인정보 보호를 위해 연락처는 비공개 메시지로 주고받을 수 있습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityHome;