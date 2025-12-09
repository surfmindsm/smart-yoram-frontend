import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { communityService, MusicSeeker } from '../../services/communityService';
import { formatCreatedAt } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass } from '../../utils/status-mapping';
import { Button } from "../ui";
import { PageContainer, PageHeader } from "../ui";
import { CommunityTable, TableColumn, TableRenderers } from '../common/CommunityTable';
import { getCities, getDistricts } from '../../data/koreaLocations';
import {
  Search,
  Plus,
  Eye,
  Heart,
  Calendar,
  MapPin,
  Clock,
  Music,
  Users,
  GraduationCap,
  Phone,
  Mail,
  Award
} from 'lucide-react';
import CustomSelect, { SelectOption } from '../common/CustomSelect';

const MusicTeamSeeking: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');
  const [loading, setLoading] = useState(true);
  const [musicSeekers, setMusicSeekers] = useState<MusicSeeker[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // 위치 필터 상태
  const [selectedLocationCity, setSelectedLocationCity] = useState('all');
  const [selectedLocationDistrict, setSelectedLocationDistrict] = useState('all');

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

  const days: SelectOption[] = [
    { value: 'all', label: '전체 요일' },
    { value: '월요일', label: '월요일' },
    { value: '화요일', label: '화요일' },
    { value: '수요일', label: '수요일' },
    { value: '목요일', label: '목요일' },
    { value: '금요일', label: '금요일' },
    { value: '토요일', label: '토요일' },
    { value: '일요일', label: '일요일' }
  ];

  const timeSlots: SelectOption[] = [
    { value: 'all', label: '전체 시간' },
    { value: '오전', label: '오전' },
    { value: '오후', label: '오후' },
    { value: '저녁', label: '저녁' },
    { value: '야간', label: '야간' },
    { value: '상시', label: '상시' },
    { value: '협의', label: '협의' }
  ];

  const getStandardStatus = (legacyStatus: string) => mapToStandardStatus(legacyStatus);
  const getStatusColor = (status: string) => getStatusClass(getStandardStatus(status));
  const getStatusText = (status: string) => getStatusLabel(getStandardStatus(status));

  // 조회수 증가 함수 (전용 API 사용)
  const incrementViewCount = async (seekerId: number) => {
    try {
      const response = await fetch(`https://api.surfmind-team.com/api/v1/community/music-team-seeking/${seekerId}/increment-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📈 음악팀지원 조회수 증가: ${data.data?.previous_view_count || 'unknown'} → ${data.data?.new_view_count || 'unknown'}`);
        return data.data?.new_view_count;
      }
    } catch (error) {
      console.error('음악팀지원 조회수 증가 실패:', error);
    }
  };

  const getTeamTypeIcon = (instrument: string) => {
    switch (instrument) {
      case '찬양팀':
      case '워십팀':
        return <Music className="w-4 h-4" />;
      case '밴드':
      case '어쿠스틱 팀':
        return <Users className="w-4 h-4" />;
      case '오케스트라':
      case '합창단':
        return <GraduationCap className="w-4 h-4" />;
      case '무용팀':
        return <Award className="w-4 h-4" />;
      default:
        return <Music className="w-4 h-4" />;
    }
  };

  const handleSeekerClick = async (seeker: MusicSeeker) => {
    // 조회수 증가 (백그라운드에서 실행)
    const newViewCount = await incrementViewCount(seeker.id);

    // 목록에서 해당 아이템의 조회수 업데이트
    if (newViewCount) {
      setMusicSeekers(prevSeekers =>
        prevSeekers.map(prevSeeker =>
          prevSeeker.id === seeker.id
            ? { ...prevSeeker, view_count: newViewCount }
            : prevSeeker
        )
      );
    }

    // 상세 페이지로 이동
    navigate(`/community/music-team-seeking/${seeker.id}`);
  };

  const columns: TableColumn[] = [
    {
      key: 'title',
      title: '제목',
      render: (value) => TableRenderers.title(value)
    },
    {
      key: 'instrument',
      title: '팀 형태',
      render: (value) => {
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
            {value}
          </span>
        );
      }
    },
    {
      key: 'churchName',
      title: '교회명',
      render: (value) => TableRenderers.church(value)
    },
    {
      key: 'userName',
      title: '작성자',
      render: (value) => TableRenderers.user(value)
    },
    {
      key: 'availableTime',
      title: '활동 시간',
      render: (value, item) => {
        const days = (item as any).availableDays || [];
        return (
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {days.join(', ')} {value}
          </div>
        );
      }
    },
    {
      key: 'status',
      title: '상태',
      render: (value) => TableRenderers.badge(getStatusText(value), getStatusColor(value))
    },
    {
      key: 'createdAt',
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
        const data = await communityService.getMusicSeekers({
          page: 1,
          limit: 50,
          instrument: selectedInstrument === 'all' ? undefined : selectedInstrument,
          day: selectedDay === 'all' ? undefined : selectedDay,
          time: selectedTime === 'all' ? undefined : selectedTime,
          search: searchTerm || undefined,
          status: 'active'
        });

        // 위치 필터링 - preferredLocation 배열에서 매칭
        const filteredData = data.filter((item: any) => {
          if (selectedLocationCity === 'all' && selectedLocationDistrict === 'all') {
            return true;
          }

          const preferredLocations = item.preferredLocation || [];
          return preferredLocations.some((location: string) => {
            const matchesCity = selectedLocationCity === 'all' || location.startsWith(selectedLocationCity);
            const matchesDistrict = selectedLocationDistrict === 'all' ||
              (selectedLocationCity !== 'all' && location.includes(selectedLocationDistrict));
            return matchesCity && matchesDistrict;
          });
        });

        setMusicSeekers(filteredData);
      } catch (error) {
        console.error('MusicTeamSeeking 데이터 로드 실패:', error);
        setMusicSeekers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedInstrument, selectedDay, selectedTime, searchTerm, selectedLocationCity, selectedLocationDistrict]);

  return (
    <PageContainer>
      <PageHeader
        title="행사팀 지원"
        description="교회 행사팀 지원서를 확인하고 관리하세요"
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
              onClick={() => navigate('/community/music-team-seeking/create')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>
        }
      />

      {/* 추가 필터들 - 별도 필터 */}
      <div className="mb-4 flex gap-4">
        <CustomSelect
          options={teamTypes}
          value={selectedInstrument}
          onChange={setSelectedInstrument}
          className="w-auto"
        />

        <CustomSelect
          options={days}
          value={selectedDay}
          onChange={setSelectedDay}
          className="w-auto"
        />

        <CustomSelect
          options={timeSlots}
          value={selectedTime}
          onChange={setSelectedTime}
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
        data={musicSeekers}
        loading={loading}
        onRowClick={handleSeekerClick}
        emptyMessage="지원서가 없습니다"
        emptyIcon={<Users className="w-12 h-12 text-gray-400" />}
        selectable={false}
      />
    </PageContainer>
  );
};

export default MusicTeamSeeking;