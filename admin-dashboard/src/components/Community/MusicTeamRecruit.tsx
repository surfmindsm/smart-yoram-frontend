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
  Phone
} from 'lucide-react';
import { Button } from '../ui/button';

interface MusicRecruitment {
  id: number;
  title: string;
  churchName: string;
  eventType: string;
  eventDate: string;
  location: string;
  neededInstruments: string[];
  salary: string;
  requirements: string;
  description: string;
  contactInfo: string;
  deadline: string;
  status: 'recruiting' | 'closed' | 'urgent';
  applicants: number;
  createdAt: string;
  views: number;
  likes: number;
  comments: number;
}

const MusicTeamRecruit: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');

  const musicRecruitments: MusicRecruitment[] = [
    {
      id: 1,
      title: '크리스마스 칸타타를 위한 연주자 모집',
      churchName: '새빛교회',
      eventType: '특별예배',
      eventDate: '2024-12-24',
      location: '서울 강남구',
      neededInstruments: ['피아노', '바이올린', '첼로', '플룻'],
      salary: '회당 15만원',
      requirements: '클래식 연주 경험 3년 이상, 악보 시창 가능',
      description: '올해 크리스마스 칸타타 공연을 위한 연주자분들을 모집합니다. 총 6회 연습과 1회 공연이 예정되어 있습니다.',
      contactInfo: '010-1234-5678 (김○○ 전도사)',
      deadline: '2024-11-15',
      status: 'recruiting',
      applicants: 8,
      createdAt: '2일 전',
      views: 156,
      likes: 23,
      comments: 12
    },
    {
      id: 2,
      title: '주일 찬양팀 드러머 급구!',
      churchName: '은혜교회',
      eventType: '주일예배',
      eventDate: '매주 일요일',
      location: '부산 해운대구',
      neededInstruments: ['드럼'],
      salary: '월 80만원',
      requirements: '드럼 연주 경험 2년 이상, 주일 오전 참석 가능',
      description: '기존 드러머 이사로 인해 새로운 드러머를 찾고 있습니다. 젊고 활기찬 찬양팀에서 함께하실 분을 기다립니다.',
      contactInfo: '051-123-4567 (박○○ 목사)',
      deadline: '2024-10-20',
      status: 'urgent',
      applicants: 3,
      createdAt: '1주일 전',
      views: 89,
      likes: 15,
      comments: 8
    },
    {
      id: 3,
      title: '결혼식 축가팀 연주자 모집',
      churchName: '중앙교회',
      eventType: '결혼식',
      eventDate: '2024-11-30',
      location: '대구 중구',
      neededInstruments: ['기타', '바이올린', '피아노'],
      salary: '1회 12만원',
      requirements: '결혼식 연주 경험 우대, 클래식/CCM 연주 가능',
      description: '교회 성도 결혼식 축가 연주를 위한 연주자를 모집합니다. 리허설 1회, 본 연주 1회 참여하시면 됩니다.',
      contactInfo: '010-9876-5432 (이○○ 집사)',
      deadline: '2024-11-10',
      status: 'recruiting',
      applicants: 5,
      createdAt: '3일 전',
      views: 67,
      likes: 8,
      comments: 5
    }
  ];

  const instruments = [
    { value: 'all', label: '전체 악기' },
    { value: '피아노', label: '피아노' },
    { value: '기타', label: '기타' },
    { value: '드럼', label: '드럼' },
    { value: '베이스', label: '베이스' },
    { value: '바이올린', label: '바이올린' },
    { value: '첼로', label: '첼로' },
    { value: '플룻', label: '플룻' }
  ];

  const eventTypes = [
    { value: 'all', label: '전체' },
    { value: '주일예배', label: '주일예배' },
    { value: '특별예배', label: '특별예배' },
    { value: '결혼식', label: '결혼식' },
    { value: '수련회', label: '수련회' },
    { value: '기타', label: '기타' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'recruiting':
        return 'bg-blue-100 text-blue-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'recruiting':
        return '모집중';
      case 'urgent':
        return '급구';
      case 'closed':
        return '마감';
      default:
        return '알 수 없음';
    }
  };

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

  const filteredRecruitments = musicRecruitments.filter(recruitment => {
    const matchesSearch = recruitment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recruitment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesInstrument = selectedInstrument === 'all' || 
                             recruitment.neededInstruments.includes(selectedInstrument);
    const matchesEventType = selectedEventType === 'all' || recruitment.eventType === selectedEventType;
    
    return matchesSearch && matchesInstrument && matchesEventType;
  });

  const formatDate = (dateString: string) => {
    if (dateString.includes('매주')) return dateString;
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">연주팀 구인</h1>
          <p className="text-gray-600">교회 행사나 예배를 위한 연주자를 모집해보세요</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          모집 등록
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="제목이나 내용으로 검색..."
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
        {filteredRecruitments.map((recruitment) => (
          <div key={recruitment.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {recruitment.eventType}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recruitment.status)}`}>
                  {getStatusText(recruitment.status)}
                </span>
                {recruitment.status === 'urgent' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                    🔥 급구
                  </span>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600">{recruitment.churchName}</div>
                <div className="text-xs text-gray-500">지원자 {recruitment.applicants}명</div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {recruitment.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  <strong className="mr-1">공연일:</strong> {formatDate(recruitment.eventDate)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-red-500" />
                  <strong className="mr-1">위치:</strong> {recruitment.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2 text-green-500" />
                  <strong className="mr-1">사례비:</strong> {recruitment.salary}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start text-sm text-gray-600">
                  <Music className="h-4 w-4 mr-2 mt-0.5 text-purple-500" />
                  <div>
                    <strong className="mr-1">모집 악기:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {recruitment.neededInstruments.map((instrument, index) => (
                        <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-purple-50 text-purple-700">
                          {getInstrumentIcon(instrument)}
                          {instrument}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2 text-orange-500" />
                  <strong className="mr-1">마감:</strong> {formatDate(recruitment.deadline)}
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-3">
              <strong>모집 요강:</strong> {recruitment.requirements}
            </p>

            <p className="text-gray-700 mb-4">
              {recruitment.description}
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2" />
                <strong className="mr-1">연락처:</strong> {recruitment.contactInfo}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {recruitment.createdAt}
                </span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {recruitment.views}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  문의 {recruitment.comments}건
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <button className="flex items-center text-xs text-gray-500 hover:text-red-500">
                  <Heart className="h-3 w-3 mr-1" />
                  {recruitment.likes}
                </button>

                <Button 
                  size="sm" 
                  disabled={recruitment.status === 'closed'}
                  className={`flex items-center gap-1 ${
                    recruitment.status === 'urgent' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Users className="h-3 w-3" />
                  {recruitment.status === 'closed' ? '마감됨' : '지원하기'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecruitments.length === 0 && (
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
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">다음</Button>
        </div>
      </div>
    </div>
  );
};

export default MusicTeamRecruit;