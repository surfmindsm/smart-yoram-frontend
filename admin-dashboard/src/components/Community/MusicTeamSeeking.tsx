import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { communityService, MusicSeeker } from '../../services/communityService';
import { formatCreatedAt } from '../../utils/dateUtils';
import { Button } from '../ui/button';
import { 
  Search, 
  Plus, 
  Grid3X3, 
  List, 
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'interviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '구직중';
      case 'interviewing':
        return '인터뷰중';
      case 'inactive':
        return '비활성';
      default:
        return '알 수 없음';
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">행사팀 지원</h1>
          <p className="text-gray-600 mt-1">교회 행사팀 지원서를 확인하고 관리하세요</p>
        </div>
        <Button 
          onClick={() => navigate('/community/music-team-seeking/create')}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          지원서 작성
        </Button>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="제목, 경력으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
            />
          </div>

          <select
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {teamTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

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

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            총 {musicSeekers.length}개의 지원서
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
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
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {musicSeekers.map((seeker) => (
            <div
              key={seeker.id}
              onClick={() => handleSeekerClick(seeker.id)}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {getTeamTypeIcon(seeker.instrument)}
                    <span className="text-sm font-medium text-gray-600">{seeker.instrument}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(seeker.status)}`}>
                    {getStatusText(seeker.status)}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {seeker.title}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{seeker.name}</span>
                    {seeker.churchName && (
                      <>
                        <span>•</span>
                        <span>{seeker.churchName}</span>
                      </>
                    )}
                  </div>
                  
                  {seeker.preferredLocation && seeker.preferredLocation.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{seeker.preferredLocation.slice(0, 2).join(', ')}</span>
                      {seeker.preferredLocation.length > 2 && (
                        <span>외 {seeker.preferredLocation.length - 2}곳</span>
                      )}
                    </div>
                  )}
                  
                  {seeker.availableDays && seeker.availableDays.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{seeker.availableDays.slice(0, 3).join(', ')}</span>
                      {seeker.availableDays.length > 3 && (
                        <span>외 {seeker.availableDays.length - 3}일</span>
                      )}
                    </div>
                  )}
                  
                  {seeker.availableTime && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{seeker.availableTime}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{seeker.views}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{seeker.likes}</span>
                    </div>
                  </div>
                  <span>{formatCreatedAt(seeker.createdAt || '')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지원자 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    팀 형태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    활동 가능
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {musicSeekers.map((seeker) => (
                  <tr 
                    key={seeker.id}
                    onClick={() => handleSeekerClick(seeker.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{seeker.title}</div>
                        <div className="text-sm text-gray-500">{seeker.name}</div>
                        {seeker.churchName && (
                          <div className="text-xs text-gray-400">{seeker.churchName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTeamTypeIcon(seeker.instrument)}
                        <span className="text-sm text-gray-900">{seeker.instrument}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {seeker.availableDays && seeker.availableDays.length > 0 && (
                          <div>{seeker.availableDays.slice(0, 2).join(', ')}</div>
                        )}
                        {seeker.availableTime && (
                          <div className="text-xs text-gray-500">{seeker.availableTime}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {seeker.contactPhone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{seeker.contactPhone}</span>
                          </div>
                        )}
                        {seeker.contactEmail && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span>{seeker.contactEmail}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(seeker.status)}`}>
                        {getStatusText(seeker.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCreatedAt(seeker.createdAt || '')}
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