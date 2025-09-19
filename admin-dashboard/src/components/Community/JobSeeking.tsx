import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  UserPlus
} from 'lucide-react';
import { Button } from '../ui/button';
import { CommunityTable, TableColumn, TableRenderers } from '../common/CommunityTable';
import { communityService, JobSeeker } from '../../services/communityService';
import { formatCreatedAt } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass, getStatusFilterOptions } from '../../utils/status-mapping';
import CustomSelect, { SelectOption } from '../common/CustomSelect';


const JobSeeking: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [jobSeekers, setJobSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);

  // 조회수 증가 함수 (전용 API 사용)
  const incrementViewCount = async (seekerId: number) => {
    try {
      const response = await fetch(`https://api.surfmind-team.com/api/v1/community/job-seeking/${seekerId}/increment-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📈 구직신청 조회수 증가: ${data.data?.previous_view_count || 'unknown'} → ${data.data?.new_view_count || 'unknown'}`);
        return data.data?.new_view_count;
      }
    } catch (error) {
      console.error('구직신청 조회수 증가 실패:', error);
    }
  };

  const handleSeekerClick = async (seeker: JobSeeker) => {
    // 조회수 증가 (백그라운드에서 실행)
    const newViewCount = await incrementViewCount(seeker.id);

    // 목록에서 해당 아이템의 조회수 업데이트
    if (newViewCount) {
      setJobSeekers(prevSeekers =>
        prevSeekers.map(prevSeeker =>
          prevSeeker.id === seeker.id
            ? { ...prevSeeker, view_count: newViewCount }
            : prevSeeker
        )
      );
    }

    // 상세 페이지로 이동
    navigate(`/community/job-seeking/${seeker.id}`);
  };

  const columns: TableColumn[] = [
    {
      key: 'title',
      title: '제목',
      render: (value) => TableRenderers.title(value)
    },
    {
      key: 'ministryField',
      title: '사역 분야',
      render: (value) => {
        const fields = value || [];
        return (
          <div className="flex flex-wrap gap-1">
            {fields.slice(0, 2).map((field: string, index: number) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {field}
              </span>
            ))}
            {fields.length > 2 && (
              <span className="text-xs text-gray-500">+{fields.length - 2}</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'church',
      title: '교회명',
      render: (value) => TableRenderers.church(value)
    },
    {
      key: 'userName',
      title: '작성자',
      render: (value, item) => TableRenderers.user(value || (item as any).name)
    },
    {
      key: 'preferredLocation',
      title: '희망 지역',
      render: (value) => {
        const locations = value || [];
        return (
          <span className="text-sm text-gray-500">
            {locations.join(', ') || '정보 없음'}
          </span>
        );
      }
    },
    {
      key: 'status',
      title: '상태',
      render: (value) => TableRenderers.badge(getStatusText(value), getStatusColor(value))
    },
    {
      key: 'created_at',
      title: '등록일',
      render: (value) => TableRenderers.date(formatCreatedAt(value))
    },
    {
      key: 'view_count',
      title: '조회수',
      render: (value) => TableRenderers.viewCount(value)
    }
  ];

  const ministryFields: SelectOption[] = [
    { value: 'all', label: '전체' },
    { value: '청년부', label: '청년부' },
    { value: '주일학교', label: '주일학교' },
    { value: '찬양팀', label: '찬양팀' },
    { value: '상담', label: '상담' },
    { value: '교육부', label: '교육부' }
  ];

  const statusOptions = getStatusFilterOptions();

  const getStandardStatus = (legacyStatus: string) => mapToStandardStatus(legacyStatus);
  const getStatusColor = (status: string) => getStatusClass(getStandardStatus(status));
  const getStatusText = (status: string) => getStatusLabel(getStandardStatus(status));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await communityService.getJobSeekers({
          ministryField: selectedField === 'all' ? undefined : selectedField,
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

        setJobSeekers(filteredData);
      } catch (error) {
        console.error('JobSeeking 데이터 로드 실패:', error);
        setJobSeekers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedField, selectedStatus, searchTerm]);

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end pr-6 mb-4">
        <div className="flex-1 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">사역자 지원</h1>
          <p className="text-sm text-gray-600">사역자분들의 이력을 확인하고 연락해보세요</p>
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
          <CustomSelect
            options={ministryFields}
            value={selectedField}
            onChange={setSelectedField}
            className="w-auto"
          />


          {/* New 버튼 */}
          <Button
            onClick={() => navigate('/community/job-seeking/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* 상태 선택 - 별도 필터 */}
      <div className="mb-4">
        <CustomSelect
          options={statusOptions}
          value={selectedStatus}
          onChange={setSelectedStatus}
          className="w-auto"
        />
      </div>

      <CommunityTable
        columns={columns}
        data={jobSeekers}
        loading={loading}
        onRowClick={handleSeekerClick}
        emptyMessage="검색 결과가 없습니다"
        emptyIcon={<UserPlus className="h-12 w-12 text-gray-400" />}
        selectable={false}
      />

    </div>
  );
};

export default JobSeeking;