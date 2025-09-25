import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  MapPin,
  Eye,
  Heart,
  Calendar,
  Users,
  Megaphone,
  Bell,
  Star
} from 'lucide-react';
import { Button } from "@/components/ui3";
import { formatCreatedAt, formatEventDate } from '../../utils/dateUtils';
import { ChurchNews as ChurchNewsType, communityService } from '../../services/communityService';
import { ChurchNewsListOptions } from '../../types/church-events';
import { mapToStandardStatus, getStatusLabel, getStatusClass } from '../../utils/status-mapping';
import CustomSelect, { SelectOption } from '../common/CustomSelect';


const ChurchNews: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [newsItems, setNewsItems] = useState<ChurchNewsType[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const categories: SelectOption[] = [
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
    return getStatusClass(mapToStandardStatus(status));
  };

  const getStatusText = (status: string) => {
    return getStatusLabel(mapToStandardStatus(status));
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

  // 조회수 증가 함수 (전용 API 사용)
  const incrementViewCount = async (newsId: number) => {
    try {
      const response = await fetch(`https://api.surfmind-team.com/api/v1/community/church-news/${newsId}/increment-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📈 교회소식 조회수 증가: ${data.data?.previous_view_count || 'unknown'} → ${data.data?.new_view_count || 'unknown'}`);
        return data.data?.new_view_count;
      }
    } catch (error) {
      console.error('교회소식 조회수 증가 실패:', error);
    }
  };

  const handleNewsClick = async (news: ChurchNewsType) => {
    // 조회수 증가 (백그라운드에서 실행)
    const newViewCount = await incrementViewCount(news.id);

    // 목록에서 해당 아이템의 조회수 업데이트
    if (newViewCount) {
      setNewsItems(prevItems =>
        prevItems.map(prevItem =>
          prevItem.id === news.id
            ? { ...prevItem, view_count: newViewCount }
            : prevItem
        )
      );
    }

    // 상세 페이지로 이동
    navigate(`/community/church-news/${news.id}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const options: ChurchNewsListOptions = {
          page: 1,
          limit: 50,
          search: searchTerm || undefined,
          sort_by: 'created_at',
          sort_order: 'desc'
        };

        // 카테고리 필터링
        if (selectedCategory !== 'all') {
          options.category = selectedCategory as any;
        }


        const response = await communityService.getChurchNews({
          page: options.page,
          limit: options.limit,
          category: options.category,
          search: options.search
        });

        // communityService.getChurchNews는 처리된 데이터 배열을 반환
        if (Array.isArray(response)) {
          setNewsItems(response);
        } else {
          console.error('행사 소식 응답 실패:', response);
          setNewsItems([]);
        }
      } catch (error) {
        console.error('행사 소식 데이터 로드 실패:', error);
        setNewsItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, searchTerm]);

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end pr-6 mb-4">
        <div className="flex-1 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">행사 소식</h1>
          <p className="text-sm text-gray-600">교회의 중요한 소식과 공지사항을 확인하세요</p>
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



          {/* New 버튼 */}
          <Button
            onClick={() => navigate('/community/church-news/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* 추가 필터들 - 별도 필터 */}
      <div className="mb-4 flex gap-4">
        <CustomSelect
          options={categories}
          value={selectedCategory}
          onChange={setSelectedCategory}
          className="w-auto"
        />

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
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    교회
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작성자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    행사일/장소
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
                    onClick={() => handleNewsClick(news)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 line-clamp-1">{news.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{news.category}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{news.church_name || '교회명 없음'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{news.userName || news.author_name || '익명'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(news.event_date || news.event_date) && (
                        <div className="text-sm text-gray-900">
                          {formatEventDate(news.event_date || news.event_date)}
                          {(news.event_time || news.event_time) && <span className="ml-1">{news.event_time || news.event_time}</span>}
                        </div>
                      )}
                      {news.location && (
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {news.location}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCreatedAt(news.created_at || news.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{news.view_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{news.likes || 0}</span>
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