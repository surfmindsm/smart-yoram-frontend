import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  Eye,
  Heart,
  MessageCircle,
  Calendar,
  Users,
  Megaphone,
  Grid3X3,
  List,
  Bell,
  Star
} from 'lucide-react';
import { Button } from '../ui/button';
import { formatCreatedAt, formatEventDate } from '../../utils/dateUtils';
import { communityService, type ChurchNews as ChurchNewsType } from '../../services/communityService';


const ChurchNews: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [newsItems, setNewsItems] = useState<ChurchNewsType[]>([]);

  const categories = [
    { value: 'all', label: '전체 카테고리' },
    // 예배/집회 관련
    { value: '특별예배', label: '특별예배/연합예배' },
    { value: '부흥회', label: '부흥회/말씀집회' },
    { value: '기도회', label: '기도회/철야기도회' },
    { value: '성례식', label: '성찬식/세례식' },
    // 교육/양육 행사
    { value: '성경공부', label: '성경공부/제자훈련' },
    { value: '세미나', label: '세미나/워크숍' },
    { value: '수련회', label: '수련회/성경학교' },
    { value: '신앙강좌', label: '신앙강좌/성경퀴즈' },
    // 친교/봉사 행사
    { value: '친교행사', label: '바자회/플리마켓' },
    { value: '체육행사', label: '야유회/체육대회' },
    { value: '봉사활동', label: '지역봉사/선교행사' },
    { value: '전도행사', label: '전도집회/노방전도' },
    // 문화/미디어 행사
    { value: '찬양행사', label: '찬양집회/음악회' },
    { value: '공연행사', label: '연극/뮤지컬' },
    { value: '미디어행사', label: '방송/음향 박람회' },
    { value: '전시행사', label: '영상/사진 전시' },
    // 기타 공동체 행사
    { value: '창립기념', label: '창립기념행사' },
    { value: '절기행사', label: '절기행사(성탄/부활절)' },
    { value: '예식행사', label: '결혼예배/장례예배' },
    { value: '리더십', label: '리더십수련회/임직식' },
    { value: '기타', label: '기타' }
  ];

  const priorities = [
    { value: 'all', label: '전체 우선순위' },
    { value: 'urgent', label: '긴급' },
    { value: 'important', label: '중요' },
    { value: 'normal', label: '일반' }
  ];

  const statusOptions = [
    { value: 'all', label: '전체 상태' },
    { value: 'active', label: '진행중' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'important':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '긴급';
      case 'important':
        return '중요';
      case 'normal':
        return '일반';
      default:
        return '알 수 없음';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Bell className="w-4 h-4" />;
      case 'important':
        return <Star className="w-4 h-4" />;
      case 'normal':
        return <Megaphone className="w-4 h-4" />;
      default:
        return <Megaphone className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '진행중';
      case 'completed':
        return '완료';
      case 'cancelled':
        return '취소';
      default:
        return '알 수 없음';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      // 예배/집회 관련
      case '특별예배':
        return <Star className="w-4 h-4" />;
      case '부흥회':
        return <Megaphone className="w-4 h-4" />;
      case '기도회':
        return <Bell className="w-4 h-4" />;
      case '성례식':
        return <Heart className="w-4 h-4" />;
      // 교육/양육 행사
      case '성경공부':
      case '세미나':
      case '수련회':
      case '신앙강좌':
        return <Users className="w-4 h-4" />;
      // 친교/봉사 행사
      case '친교행사':
      case '체육행사':
        return <Users className="w-4 h-4" />;
      case '봉사활동':
      case '전도행사':
        return <Heart className="w-4 h-4" />;
      // 문화/미디어 행사
      case '찬양행사':
      case '공연행사':
      case '미디어행사':
      case '전시행사':
        return <Star className="w-4 h-4" />;
      // 기타 공동체 행사
      case '창립기념':
      case '절기행사':
      case '예식행사':
      case '리더십':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Megaphone className="w-4 h-4" />;
    }
  };

  const handleNewsClick = (newsId: number) => {
    navigate(`/community/church-news/${newsId}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const data = await communityService.getChurchNews({
          page: 1,
          limit: 50,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          priority: selectedPriority === 'all' ? undefined : selectedPriority,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          search: searchTerm || undefined
        });
        
        setNewsItems(data);
      } catch (error) {
        console.error('행사 소식 데이터 로드 실패:', error);
        setNewsItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, selectedPriority, selectedStatus, searchTerm]);

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">행사 소식</h1>
          <p className="text-gray-600 mt-1">교회 행사와 중요한 소식을 확인하세요</p>
        </div>
        <Button 
          onClick={() => navigate('/community/church-news/create')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          소식 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="제목, 내용, 주최자로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {priorities.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>

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
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            총 {newsItems.length}개의 소식
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 컨텐츠 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : newsItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">행사 소식이 없습니다</h3>
          <p className="text-gray-600 mb-4">첫 번째 행사 소식을 등록해보세요.</p>
          <Button onClick={() => navigate('/community/church-news/create')}>
            <Plus className="w-4 h-4 mr-2" />
            소식 등록
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsItems.map((news) => (
            <div
              key={news.id}
              onClick={() => handleNewsClick(news.id)}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(news.category)}
                    <span className="text-sm font-medium text-gray-600">{news.category}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(news.priority)}`}>
                      {getPriorityText(news.priority)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(news.status)}`}>
                      {getStatusText(news.status)}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {news.title}
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {news.content}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{news.organizer}</span>
                    <span>•</span>
                    <span>{news.churchName}</span>
                  </div>

                  {news.eventDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatEventDate(news.eventDate)}</span>
                      {news.eventTime && <span>{news.eventTime}</span>}
                    </div>
                  )}

                  {news.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{news.location}</span>
                    </div>
                  )}
                </div>

                {news.tags && news.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {news.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        #{tag}
                      </span>
                    ))}
                    {news.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{news.tags.length - 3}개</span>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{news.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{news.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{news.comments}</span>
                    </div>
                  </div>
                  <span>{formatCreatedAt(news.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    소식 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    우선순위
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    주최자/교회
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    행사일/장소
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조회수
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {newsItems.map((news) => (
                  <tr 
                    key={news.id}
                    onClick={() => handleNewsClick(news.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">{news.title}</div>
                        <div className="text-sm text-gray-500 line-clamp-1">{news.content}</div>
                        <div className="text-xs text-gray-400">{news.author}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(news.category)}
                        <span className="text-sm text-gray-900">{news.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getPriorityIcon(news.priority)}
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(news.priority)}`}>
                          {getPriorityText(news.priority)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{news.organizer}</div>
                      <div className="text-sm text-gray-500">{news.churchName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {news.eventDate && (
                        <div className="text-sm text-gray-900">
                          {formatEventDate(news.eventDate)}
                          {news.eventTime && <span className="ml-1">{news.eventTime}</span>}
                        </div>
                      )}
                      {news.location && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {news.location}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(news.status)}`}>
                        {getStatusText(news.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCreatedAt(news.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{news.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{news.likes}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChurchNews;