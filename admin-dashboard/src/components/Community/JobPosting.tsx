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
import { mapToStandardStatus } from '../../utils/status-mapping';
import CustomSelect, { SelectOption } from '../common/CustomSelect';


const JobPosting: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // 구인 공고 데이터 (API에서 로드)
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  const positions: SelectOption[] = [
    { value: 'all', label: '전체' },
    { value: '목사', label: '목사' },
    { value: '전도사', label: '전도사' },
    { value: '찬양팀 리더', label: '찬양팀 리더' },
    { value: '교육부 교사', label: '교육부 교사' },
    { value: '행정간사', label: '행정간사' }
  ];


  // 사역자 모집 전용 상태 매핑
  const getJobStatusLabel = (status: string): string => {
    const standardStatus = mapToStandardStatus(status);
    switch (standardStatus) {
      case 'active':
        return '모집중';
      case 'completed':
        return '모집완료';
      case 'cancelled':
        return '모집취소';
      default:
        return '모집중';
    }
  };

  const getJobStatusClass = (status: string): string => {
    const standardStatus = mapToStandardStatus(status);
    switch (standardStatus) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // 사역자 모집 전용 상태 필터 옵션
  const statusOptions: SelectOption[] = [
    { value: 'all', label: '전체 상태' },
    { value: 'active', label: '모집중' },
    { value: 'completed', label: '모집완료' }
  ];

  const getStandardStatus = (legacyStatus: string) => mapToStandardStatus(legacyStatus);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await communityService.getJobPosts({
          position: selectedPosition === 'all' ? undefined : selectedPosition,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          search: searchTerm || undefined,
          limit: 50
        });

        // 필터링 로직 - 상태, 직책 확인
        const filteredData = data.filter((item: any) => {
          const standardStatus = getStandardStatus(item.status || 'active');
          const matchesStatus = selectedStatus === 'all' || standardStatus === selectedStatus;

          const matchesPosition = selectedPosition === 'all' || item.position === selectedPosition;

          return matchesStatus && matchesPosition;
        });
        console.log('🎯 필터 상태:', { selectedPosition, selectedStatus });
        console.log('🎯 원본 데이터:', data);
        console.log('🎯 변환된 JobPosting 데이터:', filteredData);
        console.log('🎯 첫 번째 게시글 전체:', filteredData[0]);
        setJobPosts(filteredData);
      } catch (error) {
        console.error('JobPosting 데이터 로드 실패:', error);
        setJobPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPosition, selectedStatus, searchTerm]);

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
      render: (value) => TableRenderers.badge(value || '미정', 'bg-purple-100 text-purple-800')
    },
    {
      key: 'location',
      title: '지역',
      render: (value) => TableRenderers.location(value, <MapPin className="h-3 w-3 mr-1" />)
    },
    {
      key: 'status',
      title: '상태',
      render: (value) => TableRenderers.badge(getJobStatusLabel(value), getJobStatusClass(value))
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

      {/* 필터들 */}
      <div className="mb-4 flex gap-4">
        {/* 사역자 유형 선택 */}
        <CustomSelect
          options={positions}
          value={selectedPosition}
          onChange={setSelectedPosition}
          className="w-auto"
        />


        {/* 상태 선택 */}
        <CustomSelect
          options={statusOptions}
          value={selectedStatus}
          onChange={setSelectedStatus}
          className="w-auto"
        />
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