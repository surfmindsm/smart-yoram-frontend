import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService, JobPost } from '../../services/communityService';
import CommunityPostDetail, { PostDetailData } from './CommunityPostDetail';
import { 
  Briefcase, 
  DollarSign, 
  Calendar,
  Building,
  GraduationCap
} from 'lucide-react';

const JobPostingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchJobDetail(parseInt(id));
    }
  }, [id]);

  const fetchJobDetail = async (jobId: number) => {
    try {
      setLoading(true);
      // 개별 상세 조회 API 사용 (만약 백엔드에서 지원한다면)
      const foundJob = await communityService.getJobPost(jobId);
      
      if (foundJob) {
        setJob(foundJob);
        // 조회수 증가
        await communityService.incrementView('job-posting', jobId);
      } else {
        // 상세 조회 API가 없다면 목록에서 찾기 (fallback)
        const jobs = await communityService.getJobPosts();
        const fallbackJob = jobs.find(job => job.id === jobId);
        
        if (fallbackJob) {
          setJob(fallbackJob);
          await communityService.incrementView('job-posting', jobId);
        } else {
          setError('해당 구인 공고를 찾을 수 없습니다.');
        }
      }
    } catch (err) {
      console.error('구인 공고 상세 정보 조회 실패:', err);
      setError('구인 공고 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/community/job-posting');
  };

  // JobPost를 PostDetailData로 변환
  const convertToPostDetail = (job: JobPost): PostDetailData => {
    return {
      id: job.id,
      type: 'job-posting',
      title: job.title,
      description: (job as any).description || '상세 설명이 없습니다.',
      views: job.views,
      likes: job.likes,
      createdAt: job.createdAt,
      status: job.status,
      church: job.churchName,
      location: job.location,
      contactInfo: (job as any).contactInfo,
      
      // 구인 공고 특화 필드
      position: job.position,
      jobType: job.jobType,
      salary: job.salary,
      deadline: job.deadline,
      qualifications: job.qualifications,
      benefits: job.benefits,
      churchIntro: job.churchIntro,
      userName: job.userName
    };
  };

  // 구인 공고 특화 필드 매핑
  const fieldMappings = [
    {
      label: '모집 직책',
      key: 'position',
      type: 'badge' as const,
      color: 'bg-blue-100 text-blue-800',
      render: (value: string) => (
        <div className="flex items-center">
          <Briefcase className="h-4 w-4 mr-2" />
          <span className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {value}
          </span>
        </div>
      )
    },
    {
      label: '고용 형태',
      key: 'jobType',
      type: 'text' as const,
      render: (value: string) => {
        const typeMap = {
          'full-time': { label: '상근직', color: 'bg-green-100 text-green-800' },
          'part-time': { label: '비상근직', color: 'bg-orange-100 text-orange-800' },
          'volunteer': { label: '봉사직', color: 'bg-purple-100 text-purple-800' }
        };
        const type = typeMap[value as keyof typeof typeMap] || { label: value, color: 'bg-gray-100 text-gray-800' };
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${type.color}`}>
            {type.label}
          </span>
        );
      }
    },
    {
      label: '급여 조건',
      key: 'salary',
      type: 'text' as const,
      render: (value: string) => (
        <div className="flex items-center">
          <DollarSign className="h-4 w-4 mr-2 text-green-600" />
          <span className="text-green-700 font-medium">{value || '면접 후 협의'}</span>
        </div>
      )
    },
    {
      label: '지원 마감일',
      key: 'deadline',
      type: 'text' as const,
      render: (value: string) => {
        const deadlineDate = new Date(value);
        const today = new Date();
        const isExpired = deadlineDate < today;
        
        return (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-red-600" />
            <span className={`font-medium ${isExpired ? 'text-red-600' : 'text-gray-700'}`}>
              {deadlineDate.toLocaleDateString('ko-KR')}
              {isExpired && ' (마감)'}
            </span>
          </div>
        );
      }
    },
    {
      label: '교회 소개',
      key: 'churchIntro',
      type: 'text' as const,
      render: (value: string) => (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Building className="h-4 w-4 mr-2 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">교회 소개</span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{value || '교회 소개가 없습니다.'}</p>
        </div>
      )
    },
    {
      label: '자격 요건',
      key: 'qualifications',
      type: 'array' as const,
      render: (value: string[] | string) => {
        const qualifications = Array.isArray(value) ? value : 
          (typeof value === 'string' && value) ? value.split(',').map(q => q.trim()) : [];
        
        return (
          <div>
            <div className="flex items-center mb-2">
              <GraduationCap className="h-4 w-4 mr-2 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">자격 요건</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {qualifications.length > 0 ? (
                qualifications.map((qual, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                    {qual}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">자격 요건이 명시되지 않았습니다</span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      label: '복리후생',
      key: 'benefits',
      type: 'array' as const,
      render: (value: string[] | string) => {
        const benefits = Array.isArray(value) ? value : 
          (typeof value === 'string' && value) ? value.split(',').map(b => b.trim()) : [];
        
        return (
          <div>
            <div className="flex items-center mb-2">
              <Building className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-sm font-medium text-green-800">복리후생</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {benefits.length > 0 ? (
                benefits.map((benefit, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    {benefit}
                  </span>
                ))
              ) : (
                <span className="text-gray-500 text-sm">복리후생 정보가 없습니다</span>
              )}
            </div>
          </div>
        );
      }
    }
  ];

  if (loading || error || !job) {
    return (
      <CommunityPostDetail
        post={job ? convertToPostDetail(job) : {} as PostDetailData}
        loading={loading}
        error={error}
        onBack={handleBack}
        pageTitle="사역자 모집 상세"
        fieldMappings={fieldMappings}
      />
    );
  }

  return (
    <CommunityPostDetail
      post={convertToPostDetail(job)}
      loading={loading}
      error={error}
      onBack={handleBack}
      pageTitle="사역자 모집 상세"
      fieldMappings={fieldMappings}
    />
  );
};

export default JobPostingDetail;