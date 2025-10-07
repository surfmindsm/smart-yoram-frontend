import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Clock,
  Music,
  Guitar,
  Mic,
  Drum,
  Piano,
  MapPin
} from 'lucide-react';
import { Button, DatePicker } from "../ui";
import { Spinner } from "../ui/spinner";
import { communityService } from '../../services/communityService';
import CustomSelect, { SelectOption } from '../common/CustomSelect';
import { getCities, getDistricts, formatLocation } from '../../data/koreaLocations';

const CreateMusicTeamRecruit: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    eventType: '',
    teamTypes: [] as string[],
    eventDate: '',
    rehearsalSchedule: '',
    location: '',
    detailedAddress: '',
    description: '',
    requirements: [] as string[],
    compensation: '',
    contactPhone: '',
    contactEmail: ''
  });

  const [requirementInput, setRequirementInput] = useState('');

  // 위치 선택 state
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  const eventTypes: SelectOption[] = [
    { value: 'sunday-service', label: '주일예배' },
    { value: 'wednesday-service', label: '수요예배' },
    { value: 'dawn-service', label: '새벽예배' },
    { value: 'special-service', label: '특별예배' },
    { value: 'revival', label: '부흥회' },
    { value: 'praise-meeting', label: '찬양집회' },
    { value: 'wedding', label: '결혼식' },
    { value: 'funeral', label: '장례식' },
    { value: 'retreat', label: '수련회' },
    { value: 'concert', label: '콘서트' },
    { value: 'other', label: '기타' }
  ];

  const teamTypeOptions: SelectOption[] = [
    { value: 'solo', label: '현재 솔로 활동' },
    { value: 'praise-team', label: '찬양팀' },
    { value: 'worship-team', label: '워십팀' },
    { value: 'acoustic-team', label: '어쿠스틱 팀' },
    { value: 'band', label: '밴드' },
    { value: 'orchestra', label: '오케스트라' },
    { value: 'choir', label: '합창단' },
    { value: 'dance-team', label: '무용팀' },
    { value: 'other', label: '기타' }
  ];


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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.eventType || formData.teamTypes.length === 0 || !formData.contactPhone) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const recruitData = {
        // 기본 정보 (필수)
        title: formData.title,
        eventType: formData.eventType, // 서비스에서 recruitment_type로 매핑됨
        
        // 모집 상세 (필수)
        teamTypes: formData.teamTypes, // 배열 그대로 전송
        schedule: `${formData.eventDate ? '행사일: ' + formData.eventDate : ''}${formData.rehearsalSchedule ? ', 리허설: ' + formData.rehearsalSchedule : ''}`.trim(),
        location: formData.location,
        
        // 상세 내용
        description: formData.description,
        requirements: formData.requirements.join(', '), // 배열을 문자열로 변환
        compensation: formData.compensation,
        
        // 연락처 (분리된 형태)
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        
        // 시스템 필드
        status: 'open',
        applications: 0
      };

      await communityService.createMusicRecruitment(recruitData);
      alert('행사팀 모집 공고가 등록되었습니다.');
      navigate('/community/music-team-recruit');
    } catch (error) {
      console.error('등록 실패:', error);
      alert('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };


  const addRequirement = () => {
    if (requirementInput.trim() && !formData.requirements.includes(requirementInput.trim())) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, requirementInput.trim()]
      });
      setRequirementInput('');
    }
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index)
    });
  };


  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/community/music-team-recruit')}
          className="flex items-center gap-2 mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">행사팀 모집 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">모집 정보</h2>
            
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                모집 제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 주일예배 피아니스트 모집"
                required
              />
            </div>

            {/* 행사 유형 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                행사 유형 *
              </label>
              <CustomSelect
                options={eventTypes}
                value={formData.eventType}
                onChange={(value) => setFormData({...formData, eventType: value})}
                placeholder="행사 유형 선택"
                className="w-full"
              />
            </div>

            {/* 모집 팀 형태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                모집 팀 형태 *
              </label>
              <CustomSelect
                options={teamTypeOptions}
                value={formData.teamTypes[0] || ''}
                onChange={(value) => setFormData({...formData, teamTypes: value ? [value] : []})}
                placeholder="팀 형태 선택"
                className="w-full"
              />
            </div>

            {/* 행사 일정 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  행사 날짜
                </label>
                <DatePicker
                  value={formData.eventDate}
                  onChange={(value) => setFormData({...formData, eventDate: value})}
                  placeholder="행사 날짜를 선택해주세요"
                  fromYear={2020}
                  toYear={2030}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  리허설 일정
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.rehearsalSchedule}
                    onChange={(e) => setFormData({...formData, rehearsalSchedule: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 매주 토요일 오후 2시"
                  />
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* 장소 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지역 *
              </label>
              <div className="flex mb-2">
                <CustomSelect
                  options={getCities().map(city => ({ value: city, label: city }))}
                  value={selectedCity}
                  onChange={(city) => {
                    setSelectedCity(city);
                    setSelectedDistrict('');
                    setFormData({...formData, location: formatLocation(city)});
                  }}
                  placeholder="도/시 선택"
                  className="pr-2"
                />
                <CustomSelect
                  options={getDistricts(selectedCity).map(district => ({ value: district, label: district }))}
                  value={selectedDistrict}
                  onChange={(district) => {
                    setSelectedDistrict(district);
                    setFormData({...formData, location: formatLocation(selectedCity, district)});
                  }}
                  placeholder="시/군/구 선택"
                  disabled={!selectedCity}
                />
              </div>
              {formData.location && (
                <p className="text-sm text-gray-600 mb-2">선택된 지역: {formData.location}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상세 주소
                </label>
                <input
                  type="text"
                  value={formData.detailedAddress}
                  onChange={(e) => setFormData({...formData, detailedAddress: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: ○○교회, ○○빌딩 3층"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 상세 내용 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">상세 내용</h2>
            
            {/* 상세 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상세 설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="행사 내용, 분위기, 특별한 요구사항 등을 자세히 설명해주세요"
              />
            </div>

            {/* 자격 요건 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                자격 요건
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 3년 이상 연주 경험, 악보 시창 가능"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <Button type="button" onClick={addRequirement}>추가</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requirements.map((req, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    {req}
                    <Button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      variant="ghost"
                      size="sm"
                      className="ml-1 text-blue-600 hover:text-blue-800 h-4 w-4 p-0"
                    >
                      ×
                    </Button>
                  </span>
                ))}
              </div>
            </div>

            {/* 보상 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                보상/사례비
              </label>
              <input
                type="text"
                value={formData.compensation}
                onChange={(e) => setFormData({...formData, compensation: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 회당 5만원, 봉사, 협의"
              />
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
                  담당자 연락처 <span className="text-red-500">*</span>
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
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-900 mb-2">💡 행사팀 모집 안내</h3>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• 필요한 팀 형태와 연주 수준을 구체적으로 명시해주세요.</li>
            <li>• 리허설 일정과 행사 일정을 명확히 안내해주세요.</li>
            <li>• 보상이나 사례비 조건을 미리 협의해두시면 좋습니다.</li>
            <li>• 교회의 음악 스타일이나 선호하는 장르가 있다면 함께 안내해주세요.</li>
          </ul>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/community/music-team-recruit')}
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
                <Spinner size="sm" variant="white" />
                등록 중...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                모집 등록
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateMusicTeamRecruit;