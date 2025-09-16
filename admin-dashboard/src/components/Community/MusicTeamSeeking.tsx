import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { communityService, MusicSeeker } from '../../services/communityService';
import { formatCreatedAt } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass } from '../../utils/status-mapping';
import { Button } from '../ui/button';
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

const MusicTeamSeeking: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedTime, setSelectedTime] = useState('all');
  const [loading, setLoading] = useState(true);
  const [musicSeekers, setMusicSeekers] = useState<MusicSeeker[]>([]);

  const teamTypes = [
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

  const days = [
    { value: 'all', label: '전체 요일' },
    { value: '월요일', label: '월요일' },
    { value: '화요일', label: '화요일' },
    { value: '수요일', label: '수요일' },
    { value: '목요일', label: '목요일' },
    { value: '금요일', label: '금요일' },
    { value: '토요일', label: '토요일' },
    { value: '일요일', label: '일요일' }
  ];

  const timeSlots = [
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

  const handleSeekerClick = (seekerId: number) => {
    navigate(`/community/music-team-seeking/${seekerId}`);
  };

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
          status: 'available'
        });
        setMusicSeekers(data);
      } catch (error) {
        console.error('MusicTeamSeeking 데이터 로드 실패:', error);
        setMusicSeekers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedInstrument, selectedDay, selectedTime, searchTerm]);

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end p-6 mb-4">
        <div className="flex-1 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">행사팀 지원</h1>
          <p className="text-sm text-gray-600">교회 행사팀 지원서를 확인하고 관리하세요</p>
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
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            {teamTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          {/* New 버튼 */}
          <Button
            onClick={() => navigate('/community/music-team-seeking/create')}
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
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {days.map(day => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>

          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeSlots.map(slot => (
              <option key={slot.value} value={slot.value}>
                {slot.label}
              </option>
            ))}
          </select>
      </div>

      {/* 컨텐츠 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : musicSeekers.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">지원서가 없습니다</h3>
          <p className="text-gray-600 mb-4">첫 번째 행사팀 지원서를 작성해보세요.</p>
          <Button onClick={() => navigate('/community/music-team-seeking/create')}>
            <Plus className="w-4 h-4 mr-2" />
            지원서 작성
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    팀 형태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    교회명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    활동 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조회수
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {musicSeekers.map((seeker) => (
                  <tr key={seeker.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleSeekerClick(seeker.id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{seeker.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{seeker.experience}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getTeamTypeIcon(seeker.instrument)}
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {seeker.instrument}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {seeker.userName || '익명'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {seeker.church || '협력사'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {seeker.availableDays?.join(', ')} {seeker.availableTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(seeker.status)}`}>
                        {getStatusText(seeker.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCreatedAt((seeker as any).created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {seeker.view_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicTeamSeeking;