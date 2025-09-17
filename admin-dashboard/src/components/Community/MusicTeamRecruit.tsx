import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  MapPin,
  Music,
  Guitar,
  Mic,
  Drum,
  Piano
} from 'lucide-react';
import { Button } from '../ui/button';
import { CommunityTable, TableColumn, TableRenderers } from '../common/CommunityTable';
import { communityService, MusicRecruitment } from '../../services/communityService';
import { formatCreatedAt } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass } from '../../utils/status-mapping';
import CustomSelect, { SelectOption } from '../common/CustomSelect';


const MusicTeamRecruit: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');

  const [musicRecruitments, setMusicRecruitments] = useState<MusicRecruitment[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.log('🔍 음악팀모집 LIST increment-view API 응답:', data);
        console.log(`📈 음악팀모집 조회수 증가: ${data.data?.previous_view_count || data.previous_view_count || 'unknown'} → ${data.data?.new_view_count || data.new_view_count || 'unknown'}`);
        return data.data?.new_view_count || data.new_view_count;
      }
    } catch (error) {
      console.error('음악팀모집 조회수 증가 실패:', error);
    }
  };

  const handleRecruitmentClick = async (recruitment: MusicRecruitment) => {
    // 조회수 증가 (백그라운드에서 실행)
    const newViewCount = await incrementViewCount(recruitment.id);

    // 목록에서 해당 아이템의 조회수 업데이트
    if (newViewCount) {
      setMusicRecruitments(prevRecruitments =>
        prevRecruitments.map(prevRecruitment =>
          prevRecruitment.id === recruitment.id
            ? { ...prevRecruitment, view_count: newViewCount }
            : prevRecruitment
        )
      );
    }

    // 상세 페이지로 이동
    navigate(`/community/music-team-recruit/${recruitment.id}`);
  };

  const instruments: SelectOption[] = [
    { value: 'all', label: '전체 악기' },
    { value: '피아노', label: '피아노' },
    { value: '기타', label: '기타' },
    { value: '드럼', label: '드럼' },
    { value: '베이스', label: '베이스' },
    { value: '바이올린', label: '바이올린' },
    { value: '첼로', label: '첼로' },
    { value: '플룻', label: '플룻' }
  ];

  const eventTypes: SelectOption[] = [
    { value: 'all', label: '전체' },
    { value: '주일예배', label: '주일예배' },
    { value: '특별예배', label: '특별예배' },
    { value: '결혼식', label: '결혼식' },
    { value: '수련회', label: '수련회' },
    { value: '기타', label: '기타' }
  ];

  const getStandardStatus = (legacyStatus: string) => mapToStandardStatus(legacyStatus);
  const getStatusColor = (status: string) => getStatusClass(getStandardStatus(status));
  const getStatusText = (status: string) => getStatusLabel(getStandardStatus(status));

  const getInstrumentIcon = (instrument: string) => {
    switch (instrument) {
      case '피아노':
        return <Piano className="h-3 w-3" />;
      case '기타':
        return <Guitar className="h-3 w-3" />;
      case '드럼':
        return <Drum className="h-3 w-3" />;
      case '바이올린':
      case '첼로':
      case '플룻':
        return <Music className="h-3 w-3" />;
      default:
        return <Mic className="h-3 w-3" />;
    }
  };

  const columns: TableColumn[] = [
    {
      key: 'title',
      title: '제목',
      render: (value) => TableRenderers.title(value)
    },
    {
      key: 'instruments',
      title: '악기',
      render: (value) => {
        const instruments = value || [];
        return (
          <div className="flex flex-wrap gap-1">
            {instruments.slice(0, 2).map((instrument: string, index: number) => (
              <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {getInstrumentIcon(instrument)}
                {instrument}
              </span>
            ))}
            {instruments.length > 2 && (
              <span className="text-xs text-gray-500">+{instruments.length - 2}</span>
            )}
          </div>
        );
      }
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
      render: (value) => TableRenderers.church(value)
    },
    {
      key: 'author_name',
      title: '작성자',
      render: (value) => TableRenderers.user(value)
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await communityService.getMusicRecruitments({
          instruments: selectedInstrument === 'all' ? undefined : selectedInstrument,
          search: searchTerm || undefined,
          limit: 50
        });
        setMusicRecruitments(data);
      } catch (error) {
        console.error('MusicTeamRecruit 데이터 로드 실패:', error);
        setMusicRecruitments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedInstrument, selectedEventType, searchTerm]);


  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end pr-6 mb-4">
        <div className="flex-1 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">행사팀 모집</h1>
          <p className="text-sm text-gray-600">교회 행사팀을 모집하고 참여해보세요</p>
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
            options={instruments}
            value={selectedInstrument}
            onChange={setSelectedInstrument}
            className="w-auto"
          />

          {/* New 버튼 */}
          <Button
            onClick={() => navigate('/community/music-team-recruit/create')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* 이벤트 타입 필터 - 별도 필터 */}
      <div className="mb-4">
        <CustomSelect
          options={eventTypes}
          value={selectedEventType}
          onChange={setSelectedEventType}
          className="w-auto"
        />
      </div>

      <CommunityTable
        columns={columns}
        data={musicRecruitments}
        loading={loading}
        onRowClick={handleRecruitmentClick}
        emptyMessage="검색 결과가 없습니다"
        emptyIcon={<Music className="h-12 w-12 text-gray-400" />}
        selectable={false}
      />

    </div>
  );
};

export default MusicTeamRecruit;