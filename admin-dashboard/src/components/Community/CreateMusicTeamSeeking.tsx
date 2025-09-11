import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Plus,
  Upload,
  X,
  Music,
  Guitar,
  Mic,
  Drum,
  Piano,
  MapPin,
  Award
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService } from '../../services/communityService';

const CreateMusicTeamSeeking: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    name: '',
    instruments: [] as string[],
    experience: '',
    portfolio: '',
    preferredGenre: [] as string[],
    preferredLocation: [] as string[],
    availability: '',
    contactPhone: '',
    contactEmail: ''
  });

  const [instrumentInput, setInstrumentInput] = useState('');
  const [genreInput, setGenreInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  const instrumentOptions = [
    '피아노', '키보드', '오르간', '기타', '일렉기타', '베이스', '드럼', 
    '바이올린', '첼로', '플룻', '색소폰', '트럼펫', '보컬', '기타'
  ];

  const genreOptions = [
    '찬양', '워십', '가스펠', 'CCM', '클래식', '컨템포러리', '어쿠스틱', 
    '재즈', '블루스', '팝', '기타'
  ];

  const availabilityOptions = [
    '상근 가능', '비상근 가능', '주말만 가능', '평일 오후 가능', 
    '저녁 시간 가능', '특별 행사만', '협의 가능'
  ];

  const getInstrumentIcon = (instrument: string) => {
    switch (instrument) {
      case '피아노':
      case '키보드':
      case '오르간':
        return <Piano className="h-3 w-3" />;
      case '기타':
      case '일렉기타':
        return <Guitar className="h-3 w-3" />;
      case '드럼':
        return <Drum className="h-3 w-3" />;
      case '보컬':
        return <Mic className="h-3 w-3" />;
      default:
        return <Music className="h-3 w-3" />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.name || formData.instruments.length === 0 || !formData.contactPhone) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const seekerData = {
        title: formData.title,
        name: formData.name,
        instruments: formData.instruments,
        experience: formData.experience,
        portfolio: formData.portfolio,
        preferredGenre: formData.preferredGenre,
        preferredLocation: formData.preferredLocation,
        availability: formData.availability,
        contactInfo: formData.contactPhone + (formData.contactEmail ? ` | ${formData.contactEmail}` : ''),
        email: formData.contactEmail,
        status: 'active' as const
      };

      await communityService.createMusicSeeker(seekerData);
      alert('행사팀 지원서가 등록되었습니다.');
      navigate('/community/music-team-seeking');
    } catch (error) {
      console.error('등록 실패:', error);
      alert('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const addInstrument = () => {
    if (instrumentInput.trim() && !formData.instruments.includes(instrumentInput.trim())) {
      setFormData({
        ...formData,
        instruments: [...formData.instruments, instrumentInput.trim()]
      });
      setInstrumentInput('');
    }
  };

  const removeInstrument = (index: number) => {
    setFormData({
      ...formData,
      instruments: formData.instruments.filter((_, i) => i !== index)
    });
  };

  const addGenre = () => {
    if (genreInput.trim() && !formData.preferredGenre.includes(genreInput.trim())) {
      setFormData({
        ...formData,
        preferredGenre: [...formData.preferredGenre, genreInput.trim()]
      });
      setGenreInput('');
    }
  };

  const removeGenre = (index: number) => {
    setFormData({
      ...formData,
      preferredGenre: formData.preferredGenre.filter((_, i) => i !== index)
    });
  };

  const addLocation = () => {
    if (locationInput.trim() && !formData.preferredLocation.includes(locationInput.trim())) {
      setFormData({
        ...formData,
        preferredLocation: [...formData.preferredLocation, locationInput.trim()]
      });
      setLocationInput('');
    }
  };

  const removeLocation = (index: number) => {
    setFormData({
      ...formData,
      preferredLocation: formData.preferredLocation.filter((_, i) => i !== index)
    });
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('파일 크기는 10MB 이하여야 합니다.');
        return;
      }
      setPortfolioFile(file);
    }
  };

  const removePortfolioFile = () => {
    setPortfolioFile(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/community/music-team-seeking')}
          className="flex items-center gap-2 mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">행사팀 지원 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
            
            {/* 제목과 이름 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  지원서 제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 피아노 반주 가능한 연주자입니다"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  성명 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="실명을 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 연주 가능 악기 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연주 가능 악기 *
              </label>
              <div className="flex gap-2 mb-2">
                <select
                  value={instrumentInput}
                  onChange={(e) => setInstrumentInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">악기 선택</option>
                  {instrumentOptions.map(instrument => (
                    <option key={instrument} value={instrument}>{instrument}</option>
                  ))}
                </select>
                <Button type="button" onClick={addInstrument} disabled={!instrumentInput}>
                  추가
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.instruments.map((instrument, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                    {getInstrumentIcon(instrument)}
                    <span className="ml-1">{instrument}</span>
                    <button
                      type="button"
                      onClick={() => removeInstrument(index)}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 연주 경력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연주 경력
              </label>
              <textarea
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="연주 경력, 교육 이수 내용, 활동 이력 등을 자유롭게 작성해주세요"
              />
            </div>

            {/* 선호 장르 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                선호하는 음악 장르
              </label>
              <div className="flex gap-2 mb-2">
                <select
                  value={genreInput}
                  onChange={(e) => setGenreInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">장르 선택</option>
                  {genreOptions.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
                <Button type="button" onClick={addGenre} disabled={!genreInput}>
                  추가
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.preferredGenre.map((genre, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    <Music className="h-3 w-3 mr-1" />
                    {genre}
                    <button
                      type="button"
                      onClick={() => removeGenre(index)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 활동 가능 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                활동 가능 지역
              </label>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 서울, 경기도 분당"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                  />
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <Button type="button" onClick={addLocation}>추가</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.preferredLocation.map((location, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    <MapPin className="h-3 w-3 mr-1" />
                    {location}
                    <button
                      type="button"
                      onClick={() => removeLocation(index)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 활동 가능 시간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                활동 가능 시간
              </label>
              <select
                value={formData.availability}
                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                {availabilityOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 포트폴리오 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">포트폴리오</h2>
            
            {/* 포트폴리오 링크 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                포트폴리오 링크
              </label>
              <input
                type="url"
                value={formData.portfolio}
                onChange={(e) => setFormData({...formData, portfolio: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="YouTube, SoundCloud 등의 연주 영상 링크를 입력하세요"
              />
            </div>

            {/* 포트폴리오 파일 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                포트폴리오 파일 업로드 (선택)
              </label>
              {!portfolioFile ? (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">클릭하여 업로드</span>
                      </p>
                      <p className="text-xs text-gray-500">PDF, MP3, MP4, DOC (최대 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.mp3,.mp4,.doc,.docx"
                      onChange={handlePortfolioUpload}
                    />
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                      📁
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{portfolioFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(portfolioFile.size / 1024 / 1024).toFixed(2)}MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removePortfolioFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">연락처 정보</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="010-1234-5678"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 (선택)
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 안내 사항 */}
        <div className="bg-indigo-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-indigo-900 mb-2">🎵 행사팀 지원 안내</h3>
          <ul className="text-sm text-indigo-800 space-y-1">
            <li>• 연주 가능한 악기와 수준을 정확히 기재해주세요.</li>
            <li>• 포트폴리오나 연주 영상이 있다면 함께 제출하시면 도움됩니다.</li>
            <li>• 활동 가능한 시간대와 지역을 명확히 해주세요.</li>
            <li>• 개인정보 보호를 위해 필요한 정보만 공개하시기 바랍니다.</li>
          </ul>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/community/music-team-seeking')}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                등록 중...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                지원서 등록
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateMusicTeamSeeking;