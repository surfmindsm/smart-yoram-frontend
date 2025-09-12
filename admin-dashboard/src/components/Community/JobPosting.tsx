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
  Briefcase,
  DollarSign,
  Calendar,
  Building,
  GraduationCap,
  Grid3X3,
  List
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService, JobPost } from '../../services/communityService';
import { getCreatePagePath } from './postConfigs';
import { formatCreatedAt, formatDeadline } from '../../utils/dateUtils';


const JobPosting: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // 구인 공고 데이터 (API에서 로드)
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await communityService.getJobPosts({
          position: selectedPosition === 'all' ? undefined : selectedPosition,
          jobType: selectedJobType === 'all' ? undefined : selectedJobType,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          search: searchTerm || undefined,
          limit: 50
        });
        setJobPosts(data);
      } catch (error) {
        console.error('JobPosting 데이터 로드 실패:', error);
        setJobPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPosition, selectedJobType, selectedStatus, searchTerm]);

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

  const handleJobClick = (jobId: number) => {
    navigate(`/community/job-posting/${jobId}`);
  };

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">사역자 모집</h1>
          <p className="text-gray-600">
            교회에서 필요한 사역자를 모집해보세요
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* 뷰 모드 토글 */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          <Button 
            className="flex items-center gap-2"
            onClick={() => navigate(getCreatePagePath('job-posting'))}
          >
            <Plus className="h-4 w-4" />
            사역자 모집 등록
          </Button>
        </div>
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
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">사역자 모집 목록을 불러오는 중...</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            /* 테이블 뷰 */
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        직책
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        교회명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        지역
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        마감일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        조회수
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobPosts.map((job) => (
                      <tr 
                        key={job.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleJobClick(job.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-500">{job.salary}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {job.position}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.userName || '익명'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.churchName || '협력사'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {job.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {getStatusText(job.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDeadline(job.deadline)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {job.views}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 카드 뷰 */
            <div className="space-y-4">
              {jobPosts.map((job) => (
              <div 
                key={job.id} 
                className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleJobClick(job.id)}
              >
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
                <div className="flex items-center text-sm text-gray-600 mb-2 space-x-4">
                  <span><strong className="mr-1">담당자:</strong> {job.userName || '익명'}</span>
                  <span className="flex items-center">
                    <Building className="h-4 w-4 mr-1" />
                    <strong className="mr-1">교회:</strong> {job.churchName || '협력사'}
                  </span>
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
                  <strong className="mr-1">마감일:</strong> {formatDeadline(job.deadline)}
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
                {Array.isArray(job.qualifications) 
                  ? job.qualifications.slice(0, 3).map((qualification: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                        {qualification}
                      </span>
                    ))
                  : job.qualifications && typeof job.qualifications === 'string'
                  ? (job.qualifications as string).split(',').slice(0, 3).map((qualification: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                        {qualification.trim()}
                      </span>
                    ))
                  : null
                }
                {Array.isArray(job.qualifications) && job.qualifications.length > 3 && (
                  <span className="text-xs text-gray-500">+{job.qualifications.length - 3}개 더</span>
                )}
                {job.qualifications && typeof job.qualifications === 'string' && (job.qualifications as string).split(',').length > 3 && (
                  <span className="text-xs text-gray-500">+{(job.qualifications as string).split(',').length - 3}개 더</span>
                )}
              </div>
            </div>

            {/* 복리후생 */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">복리후생</h4>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(job.benefits) 
                  ? job.benefits.map((benefit: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-50 text-green-700">
                        {benefit}
                      </span>
                    ))
                  : job.benefits && typeof job.benefits === 'string'
                  ? (job.benefits as string).split(',').map((benefit: string, index: number) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-50 text-green-700">
                        {benefit.trim()}
                      </span>
                    ))
                  : null
                }
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatCreatedAt(job.createdAt)}
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
                  onClick={(e) => {
                    e.stopPropagation(); // 카드 클릭 이벤트 방지
                    // 지원하기 로직 추가 (추후 구현)
                    console.log('지원하기 클릭:', job.id);
                  }}
                >
                  <Briefcase className="h-3 w-3" />
                  {job.status === 'open' ? '지원하기' : '모집마감'}
                </Button>
              </div>
            </div>
              </div>
            ))}
            </div>
          )}
        </>
      )}

      {/* 빈 상태 */}
      {!loading && jobPosts.length === 0 && (
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