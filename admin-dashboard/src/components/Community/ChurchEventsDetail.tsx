import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService, ChurchEvent } from '../../services/communityService';
import CommunityPostDetail, { PostDetailData } from './CommunityPostDetail';

const ChurchEventsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<ChurchEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchEventDetail(parseInt(id));
    }
  }, [id]);

  const fetchEventDetail = async (eventId: number) => {
    try {
      setLoading(true);
      const events = await communityService.getChurchEvents();
      const foundEvent = events.find(event => event.id === eventId);
      
      if (foundEvent) {
        setEvent(foundEvent);
      } else {
        setError('해당 행사를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('행사 상세 정보 조회 실패:', err);
      setError('상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const convertToPostDetail = (event: ChurchEvent): PostDetailData => {
    return {
      id: event.id,
      type: 'church-events',
      title: event.title,
      description: event.description,
      views: event.views,
      likes: 0,
      createdAt: event.createdAt,
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

  const fieldMappings = [
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

  if (!event && !loading && !error) {
    return null;
  }

  return (
    <CommunityPostDetail
      post={event ? convertToPostDetail(event) : {} as PostDetailData}
      loading={loading}
      error={error}
      onBack={() => navigate('/community/church-news')}
      pageTitle="행사 소식 상세"
      fieldMappings={fieldMappings}
    />
  );
};

export default ChurchEventsDetail;