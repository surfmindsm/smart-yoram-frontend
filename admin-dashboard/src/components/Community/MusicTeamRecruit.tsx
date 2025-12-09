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
import { Button } from "../ui";
import { PageContainer, PageHeader } from "../ui";
import { CommunityTable, TableColumn, TableRenderers } from '../common/CommunityTable';
import { communityService, MusicRecruitment } from '../../services/communityService';
import { formatCreatedAt } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass } from '../../utils/status-mapping';
import CustomSelect, { SelectOption } from '../common/CustomSelect';
import { getCities, getDistricts } from '../../data/koreaLocations';


const MusicTeamRecruit: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamType, setSelectedTeamType] = useState('all');
  const [selectedWorshipType, setSelectedWorshipType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // 위치 필터 상태
  const [selectedLocationCity, setSelectedLocationCity] = useState('all');
  const [selectedLocationDistrict, setSelectedLocationDistrict] = useState('all');

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

  const teamTypes: SelectOption[] = [
    { value: 'all', label: '전체 팀 형태' },
    { value: '현재 솔로 활동', label: '현재 솔로 활동' },
    { value: '찬양팀', label: '찬양팀' },
    { value: '워십팀', label: '워십팀' },
    { value: '어쿠스틱 팀', label: '어쿠스틱 팀' },
    { value: '밴드', label: '밴드' },
    { value: '오케스트라', label: '오케스트라' },
    { value: '합창단', label: '합창단' },
    { value: '무용팀', label: '무용팀' },
    { value: '기타', label: '기타' }
  ];

  const worshipTypes: SelectOption[] = [
    { value: 'all', label: '전체 예배 형태' },
    { value: '주일예배', label: '주일예배' },
    { value: '수요예배', label: '수요예배' },
    { value: '새벽예배', label: '새벽예배' },
    { value: '특별예배', label: '특별예배' },
    { value: '부흥회', label: '부흥회' },
    { value: '찬양집회', label: '찬양집회' },
    { value: '결혼식', label: '결혼식' },
    { value: '장례식', label: '장례식' },
    { value: '수련회', label: '수련회' },
    { value: '콘서트', label: '콘서트' },
    { value: '기타', label: '기타' }
  ];

  const getStandardStatus = (legacyStatus: string) => mapToStandardStatus(legacyStatus);
  const getStatusColor = (status: string) => getStatusClass(getStandardStatus(status));
  const getStatusText = (status: string) => getStatusLabel(getStandardStatus(status));

  const getTeamTypeIcon = (teamType: string) => {
    switch (teamType) {
      case '현재 솔로 활동':
        return <Mic className="h-3 w-3" />;
      case '찬양팀':
      case '워십팀':
        return <Music className="h-3 w-3" />;
      case '밴드':
      case '어쿠스틱 팀':
        return <Guitar className="h-3 w-3" />;
      case '오케스트라':
      case '합창단':
        return <Piano className="h-3 w-3" />;
      case '무용팀':
        return <Mic className="h-3 w-3" />;
      default:
        return <Music className="h-3 w-3" />;
    }
  };

  const columns: TableColumn[] = [
    {
      key: 'title',
      title: '제목',
      render: (value) => TableRenderers.title(value)
    },
    {
      key: 'team_types',
      title: '팀 형태',
      render: (value) => {
        // team_types는 배열이므로 첫 번째 요소만 표시
        const firstTeamType = Array.isArray(value) ? value[0] : value;
        const displayValue = firstTeamType || '미정';
        return (
          <div className="flex items-center">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {getTeamTypeIcon(displayValue)}
              {displayValue}
              {Array.isArray(value) && value.length > 1 && (
                <span className="text-purple-600">+{value.length - 1}</span>
              )}
            </span>
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
      key: 'church',
      title: '교회명',
      render: (value) => TableRenderers.church(value)
    },
    {
      key: 'userName',
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
          team_types: selectedTeamType === 'all' ? undefined : selectedTeamType,
          worship_type: selectedWorshipType === 'all' ? undefined : selectedWorshipType,
          search: searchTerm || undefined,
          limit: 50
        });

        // 위치 필터링
        const filteredData = data.filter((item: any) => {
          const itemLocation = item.location || '';
          const matchesCity = selectedLocationCity === 'all' || itemLocation.startsWith(selectedLocationCity);
          const matchesDistrict = selectedLocationDistrict === 'all' ||
            (selectedLocationCity !== 'all' && itemLocation.includes(selectedLocationDistrict));

          return matchesCity && matchesDistrict;
        });

        setMusicRecruitments(filteredData);
      } catch (error) {
        console.error('MusicTeamRecruit 데이터 로드 실패:', error);
        setMusicRecruitments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTeamType, selectedWorshipType, searchTerm, selectedLocationCity, selectedLocationDistrict]);


  return (
    <PageContainer>
      <PageHeader
        title="행사팀 모집"
        description="교회 행사팀을 모집하고 참여해보세요"
        actions={
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <Button
              onClick={() => navigate('/community/music-team-recruit/create')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
        }
      />

      {/* 필터 옵션들 */}
      <div className="mb-4 flex gap-3">
        <CustomSelect
          options={teamTypes}
          value={selectedTeamType}
          onChange={setSelectedTeamType}
          className="w-auto"
        />
        <CustomSelect
          options={worshipTypes}
          value={selectedWorshipType}
          onChange={setSelectedWorshipType}
          className="w-auto"
        />

        {/* 도/시 선택 */}
        <CustomSelect
          options={[
            { value: 'all', label: '전체 도/시' },
            ...getCities().map(city => ({ value: city, label: city }))
          ]}
          value={selectedLocationCity}
          onChange={(value) => {
            setSelectedLocationCity(value);
            setSelectedLocationDistrict('all');
          }}
          className="w-auto"
        />

        {/* 구 선택 */}
        <CustomSelect
          options={[
            { value: 'all', label: '전체 구' },
            ...getDistricts(selectedLocationCity).map(district => ({ value: district, label: district }))
          ]}
          value={selectedLocationDistrict}
          onChange={setSelectedLocationDistrict}
          className="w-auto"
          disabled={selectedLocationCity === 'all'}
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
    </PageContainer>
  );
};

export default MusicTeamRecruit;