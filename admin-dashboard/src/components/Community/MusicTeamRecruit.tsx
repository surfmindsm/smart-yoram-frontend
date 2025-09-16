import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Grid3X3,
  List
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService, MusicRecruitment } from '../../services/communityService';
import { formatCreatedAt } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass } from '../../utils/status-mapping';


const MusicTeamRecruit: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstrument, setSelectedInstrument] = useState('all');
  const [selectedEventType, setSelectedEventType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [musicRecruitments, setMusicRecruitments] = useState<MusicRecruitment[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">행사팀 모집</h1>
          <p className="text-gray-600">교회 행사나 예배를 위한 연주자를 모집해보세요</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 뷰 모드 토글 */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="px-3"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>

          <Button 
            className="flex items-center gap-2"
            onClick={() => navigate('/community/music-team-recruit/create')}
          >
            <Plus className="h-4 w-4" />
            행사팀 모집 등록
          </Button>
        </div>
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

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">행사팀 모집 목록을 불러오는 중...</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' ? (
            /* 테이블 뷰 */
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        악기
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        교회명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        지역
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
                    {musicRecruitments.map((recruitment) => (
                      <tr key={recruitment.id} className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{recruitment.title}</div>
                          <div className="text-sm text-gray-500">{recruitment.schedule}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {(recruitment.instruments || []).slice(0, 2).map((instrument, index) => (
                              <span key={index} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {getInstrumentIcon(instrument)}
                                {instrument}
                              </span>
                            ))}
                            {(recruitment.instruments || []).length > 2 && (
                              <span className="text-xs text-gray-500">+{(recruitment.instruments || []).length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recruitment.author_name || '익명'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {recruitment.church_name || '협력사'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {recruitment.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recruitment.status)}`}>
                            {getStatusText(recruitment.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(() => {
                            if (recruitment.id === 6) {
                              console.log('🔍 [UI_DEBUG] 테이블에서 ID 6 렌더링:', {
                                recruitment_createdAt: recruitment.created_at,
                                formatCreatedAt_result: formatCreatedAt(recruitment.created_at),
                                recruitment_object: recruitment
                              });
                            }
                            return formatCreatedAt(recruitment.created_at);
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {recruitment.view_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 카드 뷰 */
            <div className="space-y-4">
              {musicRecruitments.map((recruitment) => (
              <div key={recruitment.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {recruitment.recruitment_type}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recruitment.status)}`}>
                  {getStatusText(recruitment.status)}
                </span>
                {/* Show priority badge - since status is only open/closed, we'll show it based on deadline */}
                {new Date(recruitment.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                    🔥 급구
                  </span>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600 space-x-2">
                  <span>{recruitment.author_name || '익명'}</span>
                  <span>|</span>
                  <span>{recruitment.church_name || '협력사'}</span>
                </div>
                <div className="text-xs text-gray-500">지원자 {recruitment.applications}명</div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {recruitment.title}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  <strong className="mr-1">일정:</strong> {recruitment.schedule}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-red-500" />
                  <strong className="mr-1">위치:</strong> {recruitment.location}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2 text-green-500" />
                  <strong className="mr-1">요건:</strong> {recruitment.requirements}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start text-sm text-gray-600">
                  <Music className="h-4 w-4 mr-2 mt-0.5 text-purple-500" />
                  <div>
                    <strong className="mr-1">모집 악기:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(recruitment.instruments || []).map((instrument, index) => (
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
                  <strong className="mr-1">연락처:</strong> {recruitment.contact_phone}
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">
              <strong>모집 상세:</strong> {recruitment.requirements}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatCreatedAt(recruitment.created_at)}
                </span>
                <span className="flex items-center">
                  <Eye className="h-3 w-3 mr-1" />
                  {recruitment.view_count}
                </span>
                <span className="flex items-center">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  지원 {recruitment.applications}건
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
                    recruitment.status === 'open' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-500'
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
          )}
        </>
      )}

      {!loading && musicRecruitments.length === 0 && (
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