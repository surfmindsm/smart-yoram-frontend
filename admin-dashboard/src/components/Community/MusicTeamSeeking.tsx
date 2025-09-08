import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  MapPin, 
  Calendar, 
  Clock,
  Users,
  Music,
  Guitar,
  Mic,
  Drum,
  Piano,
  Eye,
  Heart,
  MessageCircle,
  User,
  Award,
  GraduationCap
} from 'lucide-react';
import { Button } from '../ui/button';

interface MusicSeeker {
  id: number;
  title: string;
  name: string;
  age: number;
  instruments: string[];
  experience: string;
  education: string;
  certifications: string[];
  introduction: string;
  availableLocation: string;
  availableSchedule: string;
  preferredEventType: string[];
  status: 'available' | 'interviewing' | 'hired';
  portfolio: string;
  createdAt: string;
  views: number;
  likes: number;
  contacts: number;
}

const MusicTeamSeeking: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');

  const musicSeekers: MusicSeeker[] = [
    {
      id: 1,
      title: '피아노와 오르간 연주 가능한 연주자입니다',
      name: '김○○',
      age: 28,
      instruments: ['피아노', '오르간', '키보드'],
      experience: '피아노 15년, 교회 반주 5년',
      education: '○○음대 피아노과 졸업',
      certifications: ['실용음악 피아노 자격증', '교회음악 지휘법 수료'],
      introduction: '어릴 때부터 교회에서 자란 PKs로서, 하나님을 찬양하는 마음으로 연주하고 있습니다. 클래식부터 CCM, 가스펠까지 다양한 장르의 연주가 가능합니다.',
      availableLocation: '서울, 경기',
      availableSchedule: '주일 오전, 평일 저녁',
      preferredEventType: ['주일예배', '특별예배', '수련회'],
      status: 'available',
      portfolio: 'youtube.com/watch?v=example',
      createdAt: '2일 전',
      views: 89,
      likes: 12,
      contacts: 7
    },
    {
      id: 2,
      title: '드럼과 퍼커션 전문 연주자',
      name: '박○○',
      age: 24,
      instruments: ['드럼', '퍼커션', '카혼'],
      experience: '드럼 8년, 밴드 활동 4년',
      education: '실용음악학과 드럼전공',
      certifications: ['실용음악 드럼 자격증'],
      introduction: '역동적이고 안정적인 리듬으로 찬양을 뒷받침하는 드러머입니다. 다양한 스타일의 연주가 가능하며, 팀워크를 중요시합니다.',
      availableLocation: '전국 (출장 가능)',
      availableSchedule: '주말, 평일 오후',
      preferredEventType: ['주일예배', '특별예배', '찬양집회'],
      status: 'interviewing',
      portfolio: 'instagram.com/drummer_example',
      createdAt: '5일 전',
      views: 156,
      likes: 28,
      contacts: 15
    },
    {
      id: 3,
      title: '바이올린 전공자, 클래식과 CCM 연주',
      name: '이○○',
      age: 32,
      instruments: ['바이올린', '비올라'],
      experience: '바이올린 20년, 교회 특송 10년',
      education: '○○예술대학 바이올린과 석사',
      certifications: ['클래식 바이올린 지도자 자격증', '현악합주 지휘법'],
      introduction: '클래식 연주자로 시작해서 교회음악에 헌신하고 있습니다. 솔로 연주부터 앙상블까지 다양한 형태의 연주가 가능합니다.',
      availableLocation: '부산, 경남',
      availableSchedule: '주일 오후, 평일 저녁',
      preferredEventType: ['특별예배', '결혼식', '수련회'],
      status: 'available',
      portfolio: 'soundcloud.com/violinist_example',
      createdAt: '1주일 전',
      views: 78,
      likes: 9,
      contacts: 4
    },
    {
      id: 4,
      title: '기타와 베이스 모두 가능한 다재다능한 연주자',
      name: '최○○',
      age: 26,
      instruments: ['기타', '베이스', '우쿨렐레'],
      experience: '기타 12년, 교회 찬양팀 6년',
      education: '실용음악과 기타 전공',
      certifications: ['기타 지도자 자격증', '음향 기술사 자격증'],
      introduction: '기타와 베이스를 모두 연주할 수 있어 팀의 필요에 따라 유연하게 대응 가능합니다. 음향 장비 세팅도 가능합니다.',
      availableLocation: '대구, 경북',
      availableSchedule: '주말, 평일 야간',
      preferredEventType: ['주일예배', '청년부 모임', '수련회'],
      status: 'available',
      portfolio: 'youtube.com/guitarist_example',
      createdAt: '3일 전',
      views: 124,
      likes: 18,
      contacts: 9
    }
  ];

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

  const filteredSeekers = musicSeekers.filter(seeker => {
    const matchesSearch = seeker.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         seeker.introduction.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInstrument = selectedInstrument === 'all' || 
                             seeker.instruments.includes(selectedInstrument);
    const matchesEventType = selectedEventType === 'all' || 
                            seeker.preferredEventType.includes(selectedEventType);
    
    return matchesSearch && matchesInstrument && matchesEventType;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">연주팀 구직</h1>
          <p className="text-gray-600">재능있는 연주자분들을 만나보세요</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          프로필 등록
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

      <div className="space-y-4">
        {filteredSeekers.map((seeker) => (
          <div key={seeker.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {seeker.instruments.slice(0, 3).map((instrument, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {getInstrumentIcon(instrument)}
                    {instrument}
                  </span>
                ))}
                {seeker.instruments.length > 3 && (
                  <span className="text-xs text-gray-500">+{seeker.instruments.length - 3}</span>
                )}
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(seeker.status)}`}>
                  {getStatusText(seeker.status)}
                </span>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-gray-500">연락 {seeker.contacts}건</div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {seeker.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <strong className="mr-1">이름:</strong> {seeker.name} ({seeker.age}세)
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <strong className="mr-1">학력:</strong> {seeker.education}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Music className="h-4 w-4 mr-2" />
                  <strong className="mr-1">경력:</strong> {seeker.experience}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <strong className="mr-1">활동 지역:</strong> {seeker.availableLocation}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <strong className="mr-1">가능 시간:</strong> {seeker.availableSchedule}
                </div>
                <div className="flex items-start text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 mt-0.5" />
                  <div>
                    <strong className="mr-1">선호 행사:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {seeker.preferredEventType.map((type, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {seeker.certifications.length > 0 && (
              <div className="mb-4">
                <div className="flex items-start text-sm text-gray-600">
                  <Award className="h-4 w-4 mr-2 mt-0.5" />
                  <div>
                    <strong className="mr-1">자격증:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {seeker.certifications.map((cert, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-50 text-green-700">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-gray-700 mb-4">
              <strong>자기소개:</strong> {seeker.introduction}
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
                  문의 {seeker.contacts}건
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <button className="flex items-center text-xs text-gray-500 hover:text-red-500">
                  <Heart className="h-3 w-3 mr-1" />
                  {seeker.likes}
                </button>

                <Button 
                  size="sm" 
                  disabled={seeker.status === 'hired'}
                  variant={seeker.status === 'available' ? 'default' : 'outline'}
                  className="flex items-center gap-1"
                >
                  <MessageCircle className="h-3 w-3" />
                  {seeker.status === 'hired' ? '채용됨' : '연락하기'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSeekers.length === 0 && (
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