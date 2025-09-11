import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Plus,
  Calendar,
  DollarSign,
  MapPin
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService } from '../../services/communityService';

const CreateJobPosting: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    position: '',
    jobType: 'full-time' as 'full-time' | 'part-time' | 'volunteer',
    salary: '',
    location: '',
    deadline: '',
    churchName: '',
    churchIntro: '',
    description: '',
    requirements: [] as string[],
    qualifications: [] as string[],
    benefits: [] as string[],
    contactPhone: '',
    contactEmail: ''
  });

  const [requirementInput, setRequirementInput] = useState('');
  const [qualificationInput, setQualificationInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');

  const positions = [
    '목사', '전도사', '교육전도사', '찬양팀 리더', '교육부 교사', '행정간사', '청년부 담당', '유아부 교사', '기타'
  ];

  const jobTypes = [
    { value: 'full-time', label: '상근직' },
    { value: 'part-time', label: '비상근직' },
    { value: 'volunteer', label: '봉사직' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.position || !formData.deadline || !formData.churchName || !formData.contactPhone) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const jobData = {
        ...formData,
        contactInfo: formData.contactPhone + (formData.contactEmail ? ` | ${formData.contactEmail}` : ''),
        email: formData.contactEmail,
        status: 'open' as const,
        applications: 0
      };

      await communityService.createJobPost(jobData);
      alert('사역자 모집 공고가 등록되었습니다.');
      navigate('/community/job-posting');
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

  const addQualification = () => {
    if (qualificationInput.trim() && !formData.qualifications.includes(qualificationInput.trim())) {
      setFormData({
        ...formData,
        qualifications: [...formData.qualifications, qualificationInput.trim()]
      });
      setQualificationInput('');
    }
  };

  const removeQualification = (index: number) => {
    setFormData({
      ...formData,
      qualifications: formData.qualifications.filter((_, i) => i !== index)
    });
  };

  const addBenefit = () => {
    if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, benefitInput.trim()]
      });
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_, i) => i !== index)
    });
  };

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/community/job-posting')}
          className="flex items-center gap-2 mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">사역자 모집 등록</h1>
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
                placeholder="예: 청년부 담당 전도사 모집"
                required
              />
            </div>

            {/* 직책과 고용 형태 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  직책 *
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">직책 선택</option>
                  {positions.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고용 형태
                </label>
                <select
                  value={formData.jobType}
                  onChange={(e) => setFormData({...formData, jobType: e.target.value as 'full-time' | 'part-time' | 'volunteer'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {jobTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 급여와 지역 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  급여 조건
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => setFormData({...formData, salary: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 월 300만원, 협의"
                  />
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  근무 지역
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 서울 강남구"
                  />
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* 마감일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지원 마감일 *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={getTodayDate()}
                  required
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 교회 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">교회 정보</h2>
            
            {/* 교회명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                교회명 *
              </label>
              <input
                type="text"
                value={formData.churchName}
                onChange={(e) => setFormData({...formData, churchName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="교회 이름을 입력하세요"
                required
              />
            </div>

            {/* 교회 소개 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                교회 소개
              </label>
              <textarea
                value={formData.churchIntro}
                onChange={(e) => setFormData({...formData, churchIntro: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="교회의 특징, 규모, 비전 등을 간단히 소개해주세요"
              />
            </div>
          </div>
        </div>

        {/* 상세 내용 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">상세 내용</h2>
            
            {/* 업무 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업무 내용
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="담당하게 될 업무와 역할을 자세히 설명해주세요"
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
                  value={qualificationInput}
                  onChange={(e) => setQualificationInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 신학대 졸업, 목사 안수"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                />
                <Button type="button" onClick={addQualification}>추가</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.qualifications.map((qual, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    {qual}
                    <button
                      type="button"
                      onClick={() => removeQualification(index)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 우대 사항 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                우대 사항
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={requirementInput}
                  onChange={(e) => setRequirementInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 청년 사역 경험, 찬양 가능"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <Button type="button" onClick={addRequirement}>추가</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requirements.map((req, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    {req}
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 복리후생 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                복리후생
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 4대보험, 연차, 숙소 제공"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                />
                <Button type="button" onClick={addBenefit}>추가</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.benefits.map((benefit, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                    {benefit}
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
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
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 사역자 모집 안내</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 명확한 업무 내용과 자격 요건을 제시하면 적합한 지원자를 받을 수 있습니다.</li>
            <li>• 급여 조건과 복리후생을 구체적으로 명시해주세요.</li>
            <li>• 교회 소개를 통해 지원자가 교회 분위기를 파악할 수 있도록 해주세요.</li>
          </ul>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/community/job-posting')}
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
                모집 등록
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateJobPosting;