import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService, MusicRecruitment } from '../../services/communityService';
import CommunityPostDetail, { PostDetailData } from './CommunityPostDetail';
import {
  Music,
  Guitar,
  Piano,
  Drum,
  Mic,
  Users,
  Calendar,
  MapPin,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';

const MusicTeamRecruitDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recruitment, setRecruitment] = useState<MusicRecruitment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 조회수 증가 함수 (전용 API 사용)
  const incrementViewCount = async (recruitmentId: number) => {
    try {
      const response = await fetch(`https://api.surfmind-team.com/api/v1/community/music-team-recruitments/${recruitmentId}/increment-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data?.new_view_count || data.new_view_count;
      }
    } catch (error) {
      console.error('음악팀모집 조회수 증가 실패:', error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRecruitmentDetail(parseInt(id));
    }
  }, [id]);

  const fetchRecruitmentDetail = async (recruitmentId: number) => {
    try {
      setLoading(true);
      // 목록에서 해당 음악팀 모집 공고 찾기
      const recruitments = await communityService.getMusicRecruitments();
      const foundRecruitment = recruitments.find(r => r.id === recruitmentId);

      if (foundRecruitment) {
        setRecruitment(foundRecruitment);
        // 조회수 증가 (직접 API 호출)
        await incrementViewCount(recruitmentId);
      } else {
        setError('해당 음악팀 모집 공고를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('음악팀 모집 상세 정보 조회 실패:', err);
      setError('음악팀 모집 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/community/music-team-recruit');
  };

  const getInstrumentIcon = (instrument: string) => {
    switch (instrument) {
      case '피아노':
        return <Piano className="h-4 w-4" />;
      case '기타':
        return <Guitar className="h-4 w-4" />;
      case '드럼':
        return <Drum className="h-4 w-4" />;
      case '바이올린':
      case '첼로':
      case '플룻':
        return <Music className="h-4 w-4" />;
      default:
        return <Mic className="h-4 w-4" />;
    }
  };

  // MusicRecruitment를 PostDetailData로 변환
  const convertToPostDetail = (recruitment: MusicRecruitment): PostDetailData => {
    return {
      id: recruitment.id,
      type: 'music-team-recruit',
      title: recruitment.title,
      description: recruitment.description || '상세 설명이 없습니다.',
      views: recruitment.view_count,
      likes: recruitment.likes,
      createdAt: recruitment.created_at,
      status: recruitment.status,
      church: recruitment.church_name,
      location: recruitment.location,
      contactInfo: recruitment.contact_info,

      // 음악팀 모집 특화 필드
      recruitment_type: recruitment.recruitment_type,
      team_types: recruitment.worship_type,
      schedule: recruitment.schedule,
      requirements: recruitment.requirements,
      compensation: recruitment.compensation,
      contact_phone: recruitment.contact_phone,
      contact_email: recruitment.contact_email,
      applications: recruitment.applications,
      userName: recruitment.author_name
    };
  };

  // 음악팀 모집 특화 필드 매핑
  const fieldMappings = [
    {
      label: '모집 유형',
      key: 'recruitment_type',
      type: 'badge' as const,
      color: 'bg-purple-100 text-purple-800',
      render: (value: string) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2" />
          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            {value}
          </span>
        </div>
      )
    },
    {
      label: '팀 형태',
      key: 'team_types',
      type: 'array' as const,
      render: (value: string[] | string) => {
        const worshipType = typeof value === 'string' ? value : '';

        return (
          <div>
            <div className="flex items-center mb-2">
              <Music className="h-4 w-4 mr-2 text-primary-600" />
              <span className="text-sm font-medium text-primary-800">팀 형태</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {worshipType ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800">
                  {getInstrumentIcon(worshipType)}
                  {worshipType}
                  </span>
              ) : (
                <span className="text-gray-500 text-sm">팀 형태 정보가 없습니다</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      label: '일정',
      key: 'schedule',
      type: 'text' as const,
      render: (value: string) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-green-600" />
          <span className="text-green-700 font-medium">{value || '일정 협의'}</span>
        </div>
      )
    },
    {
      label: '위치',
      key: 'location',
      type: 'text' as const,
      render: (value: string) => (
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-red-600" />
          <span className="text-gray-700">{value || '위치 미정'}</span>
        </div>
      )
    },
    {
      label: '자격 요건',
      key: 'requirements',
      type: 'text' as const,
      render: (value: string) => (
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Users className="h-4 w-4 mr-2 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">자격 요건</span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{value || '특별한 자격 요건이 없습니다.'}</p>
        </div>
      )
    },
    {
      label: '보상/혜택',
      key: 'compensation',
      type: 'text' as const,
      render: (value: string) => (
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-2 text-green-600" />
          <span className="text-green-700 font-medium">{value || '보상 없음 (봉사)'}</span>
        </div>
      )
    },
    {
      label: '연락처',
      key: 'contact_info',
      type: 'text' as const,
      render: (value: any, post?: PostDetailData) => (
        <div className="bg-primary-50 p-4 rounded-lg">
          <div className="flex items-center mb-3">
            <Phone className="h-4 w-4 mr-2 text-primary-600" />
            <span className="text-sm font-medium text-primary-800">연락처 정보</span>
          </div>
          <div className="space-y-2">
            {post?.contact_phone && (
              <div className="flex items-center">
                <Phone className="h-3 w-3 mr-2 text-gray-500" />
                <span className="text-sm text-gray-700">{post.contact_phone}</span>
              </div>
            )}
            {post?.contact_email && (
              <div className="flex items-center">
                <Mail className="h-3 w-3 mr-2 text-gray-500" />
                <span className="text-sm text-gray-700">{post.contact_email}</span>
              </div>
            )}
            {value && (
              <p className="text-sm text-gray-600 mt-2">{value}</p>
            )}
          </div>
        </div>
      )
    },
    {
      label: '지원 현황',
      key: 'applications',
      type: 'text' as const,
      render: (value: number) => (
        <div className="flex items-center">
          <Users className="h-4 w-4 mr-2 text-purple-600" />
          <span className="text-purple-700 font-medium">{value || 0}명 지원</span>
        </div>
      )
    }
  ];

  if (loading || error || !recruitment) {
    return (
      <CommunityPostDetail
        post={recruitment ? convertToPostDetail(recruitment) : {} as PostDetailData}
        loading={loading}
        error={error}
        onBack={handleBack}
        pageTitle="음악팀 모집 상세"
        fieldMappings={fieldMappings}
      />
    );
  }

  return (
    <CommunityPostDetail
      post={convertToPostDetail(recruitment)}
      loading={loading}
      error={error}
      onBack={handleBack}
      pageTitle="음악팀 모집 상세"
      fieldMappings={fieldMappings}
    />
  );
};

export default MusicTeamRecruitDetail;