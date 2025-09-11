import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Plus,
  Upload,
  X,
  GraduationCap,
  Award,
  MapPin
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService } from '../../services/communityService';

const CreateJobSeeking: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    name: '',
    ministryField: [] as string[],
    career: '',
    education: '',
    certifications: [] as string[],
    introduction: '',
    preferredLocation: [] as string[],
    availability: '',
    contactPhone: '',
    contactEmail: ''
  });

  const [ministryFieldInput, setMinistryFieldInput] = useState('');
  const [certificationInput, setCertificationInput] = useState('');
  const [locationInput, setLocationInput] = useState('');

  const ministryFields = [
    '목회', '교육', '찬양', '청년', '유아부', '아동부', '중고등부', '선교', '상담', '행정', '기타'
  ];

  const availabilityOptions = [
    '상근 가능', '비상근 가능', '봉사직 희망', '협의 가능'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.name || formData.ministryField.length === 0 || !formData.contactPhone) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const seekerData = {
        ...formData,
        contactInfo: formData.contactPhone + (formData.contactEmail ? ` | ${formData.contactEmail}` : ''),
        email: formData.contactEmail,
        status: 'active' as const
      };

      await communityService.createJobSeeker(seekerData);
      alert('사역자 지원서가 등록되었습니다.');
      navigate('/community/job-seeking');
    } catch (error) {
      console.error('등록 실패:', error);
      alert('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const addMinistryField = () => {
    if (ministryFieldInput.trim() && !formData.ministryField.includes(ministryFieldInput.trim())) {
      setFormData({
        ...formData,
        ministryField: [...formData.ministryField, ministryFieldInput.trim()]
      });
      setMinistryFieldInput('');
    }
  };

  const removeMinistryField = (index: number) => {
    setFormData({
      ...formData,
      ministryField: formData.ministryField.filter((_, i) => i !== index)
    });
  };

  const addCertification = () => {
    if (certificationInput.trim() && !formData.certifications.includes(certificationInput.trim())) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, certificationInput.trim()]
      });
      setCertificationInput('');
    }
  };

  const removeCertification = (index: number) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index)
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

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
      }
      setResume(file);
    }
  };

  const removeResume = () => {
    setResume(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/community/job-seeking')}
          className="flex items-center gap-2 mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">사역자 지원 등록</h1>
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
                  placeholder="예: 청년부 사역 경험있는 전도사입니다"
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

            {/* 사역 분야 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사역 분야 *
              </label>
              <div className="flex gap-2 mb-2">
                <select
                  value={ministryFieldInput}
                  onChange={(e) => setMinistryFieldInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">사역 분야 선택</option>
                  {ministryFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
                <Button type="button" onClick={addMinistryField} disabled={!ministryFieldInput}>
                  추가
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.ministryField.map((field, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    {field}
                    <button
                      type="button"
                      onClick={() => removeMinistryField(index)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 학력과 경력 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학력
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({...formData, education: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 00신학대학교 신학과 졸업"
                  />
                  <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사역 경력
                </label>
                <input
                  type="text"
                  value={formData.career}
                  onChange={(e) => setFormData({...formData, career: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 3년 (청년부 담당 2년, 교육부 1년)"
                />
              </div>
            </div>

            {/* 자격증/면허 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                자격증/면허
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={certificationInput}
                  onChange={(e) => setCertificationInput(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 목사 안수, 전도사 자격증"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                />
                <Button type="button" onClick={addCertification}>추가</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.certifications.map((cert, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    <Award className="h-3 w-3 mr-1" />
                    {cert}
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 희망 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                희망 사역 지역
              </label>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 서울, 경기도"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                  />
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                <Button type="button" onClick={addLocation}>추가</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.preferredLocation.map((location, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                    <MapPin className="h-3 w-3 mr-1" />
                    {location}
                    <button
                      type="button"
                      onClick={() => removeLocation(index)}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 근무 가능 형태 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                근무 가능 형태
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

        {/* 자기소개 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">자기소개</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                자기소개서
              </label>
              <textarea
                value={formData.introduction}
                onChange={(e) => setFormData({...formData, introduction: e.target.value})}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="자신의 사역 철학, 경험, 비전 등을 자유롭게 작성해주세요"
              />
            </div>
          </div>
        </div>

        {/* 이력서 업로드 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">이력서</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이력서 파일 업로드 (선택)
              </label>
              {!resume ? (
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">클릭하여 업로드</span>
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX (최대 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                    />
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center mr-3">
                      📄
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{resume.name}</p>
                      <p className="text-xs text-gray-500">
                        {(resume.size / 1024 / 1024).toFixed(2)}MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeResume}
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
        <div className="bg-orange-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-orange-900 mb-2">💡 사역자 지원 안내</h3>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• 정확한 정보를 기재해주시면 더 적합한 사역지를 찾을 수 있습니다.</li>
            <li>• 사역 분야와 희망 지역을 구체적으로 명시해주세요.</li>
            <li>• 자기소개서를 통해 자신의 사역 철학을 잘 표현해주세요.</li>
            <li>• 이력서 첨부 시 개인정보 보호에 유의해주세요.</li>
          </ul>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/community/job-seeking')}
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

export default CreateJobSeeking;