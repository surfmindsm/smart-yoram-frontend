import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  MapPin, 
  Calendar, 
  Clock,
  Music,
  Guitar,
  Mic,
  Drum,
  Piano,
  Eye,
  Heart,
  MessageCircle,
  User,
  GraduationCap
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService, MusicSeeker } from '../../services/communityService';


const MusicTeamSeeking: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');

  const [musicSeekers, setMusicSeekers] = useState<MusicSeeker[]>([]);
  const [loading, setLoading] = useState(true);

  const instruments = [
    { value: 'all', label: '전체 악기' },
    { value: '피아노', label: '피아노' },
    { value: '기타', label: '기타' },
    { value: '드럼', label: '드럼' },
    { value: '베이스', label: '베이스' },
    { value: '바이올린', label: '바이올린' },
    { value: '오르간', label: '오르간' },
    { value: '플룻', label: '플룻' }
  ];

  const eventTypes = [
    { value: 'all', label: '전체' },
    { value: '주일예배', label: '주일예배' },
    { value: '특별예배', label: '특별예배' },
    { value: '결혼식', label: '결혼식' },
    { value: '수련회', label: '수련회' },
    { value: '찬양집회', label: '찬양집회' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'interviewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'hired':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return '구직중';
      case 'interviewing':
        return '면접중';
      case 'hired':
        return '채용됨';
      default:
        return '알 수 없음';
    }
  };

  const getInstrumentIcon = (instrument: string) => {
    switch (instrument) {
      case '피아노':
      case '키보드':
      case '오르간':
        return <Piano className="h-3 w-3" />;
      case '기타':
        return <Guitar className="h-3 w-3" />;
      case '드럼':
      case '퍼커션':
      case '카혼':
        return <Drum className="h-3 w-3" />;
      case '바이올린':
      case '비올라':
      case '첼로':
      case '플룻':
        return <Music className="h-3 w-3" />;
      default:
        return <Mic className="h-3 w-3" />;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await communityService.getMusicSeekers({
          instrument: selectedInstrument === 'all' ? undefined : selectedInstrument,
          genre: selectedEventType === 'all' ? undefined : selectedEventType,
          search: searchTerm || undefined,
          limit: 50
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
  }, [selectedInstrument, selectedEventType, searchTerm]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">행사팀 지원</h1>
          <p className="text-gray-600">재능있는 연주자분들을 만나보세요</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          행사팀 지원 등록
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="제목이나 소개글로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={selectedInstrument}
            onChange={(e) => setSelectedInstrument(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {instruments.map(instrument => (
              <option key={instrument.value} value={instrument.value}>
                {instrument.label}
              </option>
            ))}
          </select>

          <select
            value={selectedEventType}
            onChange={(e) => setSelectedEventType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {eventTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">연주팀 구직 목록을 불러오는 중...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {musicSeekers.map((seeker) => (
          <div key={seeker.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {(seeker.instruments || []).slice(0, 3).map((instrument, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {getInstrumentIcon(instrument)}
                    {instrument}
                  </span>
                ))}
                {(seeker.instruments || []).length > 3 && (
                  <span className="text-xs text-gray-500">+{(seeker.instruments || []).length - 3}</span>
                )}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(seeker.status)}`}>
                  {getStatusText(seeker.status)}
                </span>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-gray-500">매칭 {seeker.matches}건</div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {seeker.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <strong className="mr-1">이름:</strong> {seeker.name}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <strong className="mr-1">포트폴리오:</strong> {seeker.portfolio || '없음'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Music className="h-4 w-4 mr-2" />
                  <strong className="mr-1">경력:</strong> {seeker.experience}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <strong className="mr-1">활동 지역:</strong> {(seeker.preferredLocation || []).join(', ') || '정보 없음'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <strong className="mr-1">가능 시간:</strong> {seeker.availability}
                </div>
                <div className="flex items-start text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 mt-0.5" />
                  <div>
                    <strong className="mr-1">선호 행사:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(seeker.preferredGenre || []).map((type, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>


            <p className="text-gray-700 mb-4">
              <strong>자기소개:</strong> {seeker.experience}
            </p>

            {seeker.portfolio && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-center text-sm text-blue-700">
                  <Music className="h-4 w-4 mr-2" />
                  <strong className="mr-1">포트폴리오:</strong>
                  <a href={`https://${seeker.portfolio}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    {seeker.portfolio}
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {seeker.createdAt}
                </span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {seeker.views}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  매칭 {seeker.matches}건
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <button className="flex items-center text-xs text-gray-500 hover:text-red-500">
                  <Heart className="h-3 w-3 mr-1" />
                  {seeker.likes}
                </button>

                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/community/music-team-seeking/${seeker.id}`)}
                  className="flex items-center gap-1 mr-2"
                >
                  자세히 보기
                </Button>
                
                <Button 
                  size="sm" 
                  disabled={seeker.status === 'inactive'}
                  variant={seeker.status === 'active' ? 'default' : 'outline'}
                  className="flex items-center gap-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  {seeker.status === 'inactive' ? '비활성' : '연락하기'}
                </Button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {!loading && musicSeekers.length === 0 && (
        <div className="text-center py-12">
          <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            검색 결과가 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            다른 검색어나 필터를 시도해보세요.
          </p>
        </div>
      )}

      <div className="flex justify-center mt-8">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>이전</Button>
          <Button size="sm">1</Button>
          <Button variant="outline" size="sm">다음</Button>
        </div>
      </div>
    </div>
  );
};

export default MusicTeamSeeking;