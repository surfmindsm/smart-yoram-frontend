import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { communityService, ChurchEvent, ChurchNews } from '../../services/communityService';
import CommunityPostDetail, { PostDetailData } from './CommunityPostDetail';

const ChurchEventsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState<ChurchEvent | null>(null);
  const [newsItem, setNewsItem] = useState<ChurchNews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL 경로를 확인하여 교회 소식인지 교회 행사인지 판단
  const isChurchNews = location.pathname.includes('church-news');

  useEffect(() => {
    if (id) {
      fetchEventDetail(parseInt(id));
    }
  }, [id]);

  const fetchEventDetail = async (eventId: number) => {
    try {
      setLoading(true);

      if (isChurchNews) {
        // 교회 소식 데이터 가져오기 - 같은 서비스 사용
        const newsResponse = await communityService.getChurchNews({
          page: 1,
          limit: 100
        });
        console.log('🔍 communityService.getChurchNews() 응답:', newsResponse);

        // communityService.getChurchNews는 처리된 데이터 배열을 반환
        const newsData = Array.isArray(newsResponse) ? newsResponse : [];
        console.log('🔍 처리된 newsData:', newsData);

        const foundNews = newsData.find((news: any) => news.id === eventId);

        if (foundNews) {
          setNewsItem(foundNews);
        } else {
          setError('해당 교회 소식을 찾을 수 없습니다.');
        }
      } else {
        // 교회 행사 데이터 가져오기
        const events = await communityService.getChurchEvents();
        const foundEvent = events.find(event => event.id === eventId);

        if (foundEvent) {
          setEvent(foundEvent);
        } else {
          setError('해당 행사를 찾을 수 없습니다.');
        }
      }
    } catch (err) {
      console.error('상세 정보 조회 실패:', err);
      setError('상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const convertToPostDetail = (data: ChurchEvent | ChurchNews): PostDetailData => {
    if (isChurchNews) {
      const news = data as any; // API 응답이 ChurchNews 타입과 다를 수 있음
      return {
        id: news.id,
        type: 'church-news',
        title: news.title,
        description: news.content || '',
        views: news.view_count || 0,
        likes: news.likes || 0,
        createdAt: news.created_at,
        status: news.status,
        category: news.category,
        church: undefined,
        location: news.location,
        // 교회 소식 특화 필드들
        priority: news.priority,
        event_date: news.event_date,
        organizer: news.organizer
      };
    } else {
      const event = data as ChurchEvent;
      return {
        id: event.id,
        type: 'church-events',
        title: event.title,
        description: event.description,
        views: event.view_count,
        likes: 0,
        createdAt: (event as any).created_at,
        status: event.status,
        category: event.eventType,
        church: event.church || undefined,
        location: event.location,
        contactInfo: event.contact,
        // 교회 행사 특화 필드들
        startDate: event.startDate,
        endDate: event.endDate,
        registrationRequired: event.registrationRequired,
        capacity: event.capacity,
        currentParticipants: event.currentParticipants
      };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const currentData = isChurchNews ? newsItem : event;

  const fieldMappings = isChurchNews ? [
    {
      label: '우선순위',
      key: 'priority',
      type: 'badge' as const,
      color: newsItem?.priority === 'urgent' ? 'bg-red-100 text-red-800' :
             newsItem?.priority === 'important' ? 'bg-orange-100 text-orange-800' :
             'bg-primary-100 text-primary-800'
    },
    {
      label: '카테고리',
      key: 'category',
      type: 'badge' as const,
      color: 'bg-purple-100 text-purple-800'
    },
    ...(newsItem?.organizer ? [{
      label: '주최자',
      key: 'organizer',
      type: 'text' as const
    }] : []),
    ...(newsItem?.event_date ? [{
      label: '행사 일정',
      key: 'event_date',
      type: 'text' as const,
      render: (value: string) => formatDate(value)
    }] : [])
  ] : [
    {
      label: '행사 일시',
      key: 'startDate',
      type: 'text' as const,
      render: (value: any, post?: PostDetailData) => {
        const startDate = formatDate(value);
        const endDate = post?.endDate ? formatDate(post.endDate) : null;
        return endDate && post?.endDate !== value ? `${startDate} ~ ${endDate}` : startDate;
      }
    },
    {
      label: '행사 유형',
      key: 'eventType',
      type: 'badge' as const,
      color: 'bg-purple-100 text-purple-800'
    },
    ...(event?.registrationRequired ? [
      {
        label: '참가 신청',
        key: 'registrationInfo',
        type: 'text' as const,
        render: () => `${event?.currentParticipants}/${event?.capacity}명 신청`
      }
    ] : [])
  ];

  if (!currentData && !loading && !error) {
    return null;
  }

  return (
    <CommunityPostDetail
      post={currentData ? convertToPostDetail(currentData) : {} as PostDetailData}
      loading={loading}
      error={error}
      onBack={() => navigate('/community/church-news')}
      pageTitle={isChurchNews ? "교회 소식 상세" : "행사 소식 상세"}
      fieldMappings={fieldMappings}
    />
  );
};

export default ChurchEventsDetail;