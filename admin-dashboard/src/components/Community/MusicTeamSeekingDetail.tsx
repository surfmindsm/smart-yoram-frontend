import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService, MusicSeeker } from '../../services/communityService';
import CommunityPostDetail, { PostDetailData } from './CommunityPostDetail';

const MusicTeamSeekingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [seeker, setSeeker] = useState<MusicSeeker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSeekerDetail(parseInt(id));
    }
  }, [id]);

  const fetchSeekerDetail = async (seekerId: number) => {
    try {
      setLoading(true);
      const foundSeeker = await communityService.getMusicSeekerById(seekerId);
      
      if (foundSeeker) {
        setSeeker(foundSeeker);
      } else {
        setError('해당 구인 정보를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('구인 상세 정보 조회 실패:', err);
      setError('상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const convertToPostDetail = (seeker: MusicSeeker): PostDetailData => {
    return {
      id: seeker.id,
      type: 'music-team-seeking',
      title: seeker.title,
      description: seeker.experience,
      views: seeker.views,
      likes: seeker.likes,
      createdAt: seeker.createdAt,
      status: seeker.status,
      // 연주팀 구직 특화 필드들
      name: seeker.name,
      instruments: seeker.instruments,
      experience: seeker.experience,
      portfolio: seeker.portfolio,
      preferredGenre: seeker.preferredGenre,
      preferredLocation: seeker.preferredLocation,
      availability: seeker.availability,
      matches: seeker.matches
    };
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '구직중';
      case 'inactive':
        return '비활성';
      default:
        return '알 수 없음';
    }
  };

  const fieldMappings = [
    {
      label: '이름',
      key: 'name',
      type: 'text' as const
    },
    {
      label: '연주 가능 악기',
      key: 'instruments',
      type: 'array' as const
    },
    {
      label: '활동 지역',
      key: 'preferredLocation',
      type: 'array' as const
    },
    {
      label: '가능 시간',
      key: 'availability',
      type: 'text' as const
    },
    {
      label: '선호 장르',
      key: 'preferredGenre',
      type: 'array' as const
    },
    {
      label: '포트폴리오',
      key: 'portfolio',
      type: 'text' as const,
      render: (value: any) => {
        if (!value) return null;
        return (
          <a 
            href={value.startsWith('http') ? value : `https://${value}`}
            className="text-blue-600 hover:underline" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            {value}
          </a>
        );
      }
    },
    {
      label: '매칭 건수',
      key: 'matches',
      type: 'badge' as const,
      color: 'bg-blue-100 text-blue-800',
      render: (value: any) => `${value}건`
    },
    {
      label: '구직 상태',
      key: 'status',
      type: 'badge' as const,
      color: seeker?.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800',
      render: (value: any) => getStatusText(value)
    }
  ];

  if (!seeker && !loading && !error) {
    return null;
  }

  return (
    <CommunityPostDetail
      post={seeker ? convertToPostDetail(seeker) : {} as PostDetailData}
      loading={loading}
      error={error}
      onBack={() => navigate('/community/music-team-seeking')}
      pageTitle="행사팀 지원 상세"
      fieldMappings={fieldMappings}
    />
  );
};

export default MusicTeamSeekingDetail;