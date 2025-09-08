import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  Clock, 
  Eye,
  Heart,
  MessageCircle,
  Briefcase,
  DollarSign,
  Calendar,
  Building,
  GraduationCap
} from 'lucide-react';
import { Button } from '../ui/button';

interface JobPost {
  id: number;
  title: string;
  churchName: string;
  churchIntro: string;
  position: string;
  jobType: 'full-time' | 'part-time' | 'volunteer';
  salary: string;
  benefits: string[];
  qualifications: string[];
  requiredDocuments: string[];
  location: string;
  deadline: string;
  status: 'open' | 'closed' | 'filled';
  createdAt: string;
  views: number;
  likes: number;
  applications: number;
}

const JobPosting: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // 임시 데이터
  const jobPosts: JobPost[] = [
    {
      id: 1,
      title: '주일학교 담당 전도사 모집',
      churchName: '새빛교회',
      churchIntro: '1987년 설립된 개척교회로 성도 약 200명의 따뜻한 교회입니다.',
      position: '전도사',
      jobType: 'full-time',
      salary: '월 200만원 ~ 250만원',
      benefits: ['주거 지원', '식비 지원', '교통비 지원', '건강보험'],
      qualifications: ['신학 학사 이상', '주일학교 사역 경험 2년 이상', '찬양 인도 가능자 우대'],
      requiredDocuments: ['이력서', '자기소개서', '추천서 2부', '설교문 3편'],
      location: '서울 강남구 역삼동',
      deadline: '2025-09-30',
      status: 'open',
      createdAt: '2일 전',
      views: 45,
      likes: 8,
      applications: 3
    },
    {
      id: 2,
      title: '청년부 담당 목사 채용',
      churchName: '은혜교회',
      churchIntro: '청년들이 많은 활기찬 교회로 약 300명의 성도가 있습니다.',
      position: '목사',
      jobType: 'full-time',
      salary: '협의',
      benefits: ['사택 제공', '차량 지원', '연수비 지원'],
      qualifications: ['목회학 석사(M.Div) 이상', '청년 사역 경험 3년 이상', '영어 가능자 우대'],
      requiredDocuments: ['이력서', '자기소개서', '목회철학서', '추천서 3부'],
      location: '부산 해운대구 우동',
      deadline: '2025-10-15',
      status: 'open',
      createdAt: '1주일 전',
      views: 78,
      likes: 15,
      applications: 7
    },
    {
      id: 3,
      title: '찬양팀 리더 봉사자 모집',
      churchName: '평강교회',
      churchIntro: '소규모 교회로 가족같은 분위기의 따뜻한 공동체입니다.',
      position: '찬양팀 리더',
      jobType: 'volunteer',
      salary: '봉사',
      benefits: ['교통비 지원', '식비 지원'],
      qualifications: ['찬양 인도 경험 1년 이상', '기타 또는 키보드 연주 가능', '화성 이해'],
      requiredDocuments: ['간단한 이력서', '자기소개서'],
      location: '대구 중구 동성로',
      deadline: '2025-09-25',
      status: 'open',
      createdAt: '3일 전',
      views: 32,
      likes: 6,
      applications: 2
    }
  ];

  const positions = [
    { value: 'all', label: '전체' },
    { value: '목사', label: '목사' },
    { value: '전도사', label: '전도사' },
    { value: '찬양팀 리더', label: '찬양팀 리더' },
    { value: '교육부 교사', label: '교육부 교사' },
    { value: '행정간사', label: '행정간사' }
  ];

  const jobTypes = [
    { value: 'all', label: '전체' },
    { value: 'full-time', label: '상근직' },
    { value: 'part-time', label: '비상근직' },
    { value: 'volunteer', label: '봉사직' }
  ];

  const statusOptions = [
    { value: 'all', label: '전체' },
    { value: 'open', label: '모집중' },
    { value: 'closed', label: '마감' },
    { value: 'filled', label: '채용완료' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'filled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return '모집중';
      case 'closed':
        return '마감';
      case 'filled':
        return '채용완료';
      default:
        return '알 수 없음';
    }
  };

  const getJobTypeText = (jobType: string) => {
    switch (jobType) {
      case 'full-time':
        return '상근직';
      case 'part-time':
        return '비상근직';
      case 'volunteer':
        return '봉사직';
      default:
        return jobType;
    }
  };

  const getJobTypeColor = (jobType: string) => {
    switch (jobType) {
      case 'full-time':
        return 'bg-blue-100 text-blue-800';
      case 'part-time':
        return 'bg-orange-100 text-orange-800';
      case 'volunteer':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredJobs = jobPosts.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.churchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = selectedPosition === 'all' || job.position === selectedPosition;
    const matchesJobType = selectedJobType === 'all' || job.jobType === selectedJobType;
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
    
    return matchesSearch && matchesPosition && matchesJobType && matchesStatus;
  });

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '마감';
    if (diffDays === 0) return '오늘 마감';
    if (diffDays === 1) return '내일 마감';
    return `${diffDays}일 남음`;
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">사역자 구인</h1>
          <p className="text-gray-600">
            교회에서 필요한 사역자를 모집해보세요
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          구인 등록
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="교회명, 직책, 제목으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {positions.map(position => (
              <option key={position.value} value={position.value}>
                {position.label}
              </option>
            ))}
          </select>

          <select
            value={selectedJobType}
            onChange={(e) => setSelectedJobType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {jobTypes.map(jobType => (
              <option key={jobType.value} value={jobType.value}>
                {jobType.label}
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
      </div>

      {/* 구인 목록 */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getJobTypeColor(job.jobType)}`}>
                  {getJobTypeText(job.jobType)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {getStatusText(job.status)}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-red-600 font-medium">
                <Calendar className="h-4 w-4 mr-1" />
                {getDaysUntilDeadline(job.deadline)}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {job.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Building className="h-4 w-4 mr-2" />
                  <strong className="mr-1">교회:</strong> {job.churchName}
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <strong className="mr-1">직책:</strong> {job.position}
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <strong className="mr-1">급여:</strong> {job.salary}
                </div>
              </div>
              <div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-2" />
                  <strong className="mr-1">위치:</strong> {job.location}
                </div>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  <strong className="mr-1">마감일:</strong> {new Date(job.deadline).toLocaleDateString('ko-KR')}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <strong className="mr-1">지원자:</strong> {job.applications}명
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-3">
              <strong>교회 소개:</strong> {job.churchIntro}
            </p>

            {/* 자격요건 */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">자격요건</h4>
              <div className="flex flex-wrap gap-1">
                {job.qualifications.slice(0, 3).map((qualification, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                    {qualification}
                  </span>
                ))}
                {job.qualifications.length > 3 && (
                  <span className="text-xs text-gray-500">+{job.qualifications.length - 3}개 더</span>
                )}
              </div>
            </div>

            {/* 복리후생 */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">복리후생</h4>
              <div className="flex flex-wrap gap-1">
                {job.benefits.map((benefit, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-50 text-green-700">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {job.createdAt}
                </span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {job.views}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button className="flex items-center text-xs text-gray-500 hover:text-red-500">
                    <Heart className="h-3 w-3 mr-1" />
                    {job.likes}
                  </button>
                  <button className="flex items-center text-xs text-gray-500 hover:text-blue-500">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    문의하기
                  </button>
                </div>

                <Button 
                  variant={job.status === 'open' ? 'default' : 'outline'} 
                  size="sm" 
                  disabled={job.status !== 'open'}
                  className="flex items-center gap-1"
                >
                  <Briefcase className="h-3 w-3" />
                  {job.status === 'open' ? '지원하기' : '모집마감'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredJobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            검색 결과가 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            다른 검색어나 필터를 시도해보세요.
          </p>
        </div>
      )}

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-8">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>이전</Button>
          <Button size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">다음</Button>
        </div>
      </div>
    </div>
  );
};

export default JobPosting;