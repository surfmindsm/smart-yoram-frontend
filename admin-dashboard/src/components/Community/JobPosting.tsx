import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  MapPin,
  Briefcase
} from 'lucide-react';
import { Button } from '../ui/button';
import { CommunityTable, TableColumn, TableRenderers } from '../common/CommunityTable';
import { communityService, JobPost } from '../../services/communityService';
import { getCreatePagePath } from './postConfigs';
import { formatDeadline } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass, getStatusFilterOptions } from '../../utils/status-mapping';


const JobPosting: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedJobType, setSelectedJobType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

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

  const statusOptions = getStatusFilterOptions();

  const getStandardStatus = (legacyStatus: string) => mapToStandardStatus(legacyStatus);
  const getStatusColor = (status: string) => getStatusClass(getStandardStatus(status));
  const getStatusText = (status: string) => getStatusLabel(getStandardStatus(status));

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

        // 필터링 로직에서 표준 상태값 사용
        const filteredData = data.filter((item: any) => {
          const standardStatus = getStandardStatus(item.status || 'active');
          const matchesStatus = selectedStatus === 'all' || standardStatus === selectedStatus;
          return matchesStatus;
        });
        setJobPosts(filteredData);
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

  // 조회수 증가 함수 (전용 API 사용)
  const incrementViewCount = async (jobId: number) => {
    try {
      const response = await fetch(`https://api.surfmind-team.com/api/v1/community/job-posting/${jobId}/increment-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📈 구인공고 조회수 증가: ${data.data?.previous_view_count || 'unknown'} → ${data.data?.new_view_count || 'unknown'}`);
        return data.data?.new_view_count;
      }
    } catch (error) {
      console.error('구인공고 조회수 증가 실패:', error);
    }
  };

  const handleJobClick = async (job: JobPost) => {
    // 조회수 증가 (백그라운드에서 실행)
    const newViewCount = await incrementViewCount(job.id);

    // 목록에서 해당 아이템의 조회수 업데이트
    if (newViewCount) {
      setJobPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === job.id
            ? { ...post, view_count: newViewCount }
            : post
        )
      );
    }

    // 상세 페이지로 이동
    navigate(`/community/job-posting/${job.id}`);
  };

  const columns: TableColumn[] = [
    {
      key: 'title',
      title: '제목',
      render: (value) => TableRenderers.title(value)
    },
    {
      key: 'position',
      title: '직책',
      render: (value) => TableRenderers.badge(value)
    },
    {
      key: 'location',
      title: '지역',
      render: (value) => TableRenderers.location(value, <MapPin className="h-3 w-3 mr-1" />)
    },
    {
      key: 'status',
      title: '상태',
      render: (value) => TableRenderers.badge(getStatusText(value), getStatusColor(value))
    },
    {
      key: 'church_name',
      title: '교회명',
      render: (value, item) => TableRenderers.church((item as any).church_name)
    },
    {
      key: 'userName',
      title: '작성자',
      render: (value) => TableRenderers.user(value)
    },
    {
      key: 'deadline',
      title: '마감일',
      render: (value) => TableRenderers.date(formatDeadline(value))
    },
    {
      key: 'view_count',
      title: '조회수',
      render: (value) => TableRenderers.viewCount(value)
    }
  ];

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end pr-6 mb-4">
        <div className="flex-1 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">사역자 모집</h1>
          <p className="text-sm text-gray-600">교회에서 필요한 사역자를 모집해보세요</p>
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

          {/* 필터 버튼 */}
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            {positions.map(position => (
              <option key={position.value} value={position.value}>
                {position.label}
              </option>
            ))}
          </select>

          {/* New 버튼 */}
          <Button
            onClick={() => navigate(getCreatePagePath('job-posting'))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* 추가 필터들 - 별도 필터 */}
      <div className="mb-4 flex gap-4">
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

      <CommunityTable
        columns={columns}
        data={jobPosts}
        loading={loading}
        onRowClick={handleJobClick}
        emptyMessage="검색 결과가 없습니다"
        emptyIcon={<Briefcase className="h-12 w-12 text-gray-400" />}
        selectable={false}
      />

    </div>
  );
};

export default JobPosting;