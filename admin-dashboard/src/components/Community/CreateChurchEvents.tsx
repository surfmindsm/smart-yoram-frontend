import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import communityService from '../../services/communityService';

interface ChurchEventFormData {
  title: string;
  content: string;
  event_date: string;
  event_time: string;
  location: string;
  category: string;
  contactPhone: string;
  contactEmail: string;
  registration_required: boolean;
  registration_deadline?: string;
  max_participants?: number;
  fee: number;
  age_restriction: string;
  special_notes: string;
  images: File[];
}

const CreateChurchEvents: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ChurchEventFormData>({
    title: '',
    content: '',
    event_date: '',
    event_time: '',
    location: '',
    category: '',
    contactPhone: '',
    contactEmail: '',
    registration_required: false,
    registration_deadline: '',
    max_participants: undefined,
    fee: 0,
    age_restriction: '',
    special_notes: '',
    images: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    '예배/집회',
    '교육/세미나',
    '봉사활동',
    '문화행사',
    '야외활동',
    '선교활동',
    '기타'
  ];

  const ageRestrictions = [
    '제한없음',
    '유아 (0-7세)',
    '아동 (8-13세)',
    '청소년 (14-19세)',
    '청년 (20-35세)',
    '중년 (36-55세)',
    '장년 (56세 이상)'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? undefined : parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          alert(`${file.name}은 10MB를 초과합니다.`);
          return false;
        }
        return true;
      });
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...validFiles].slice(0, 5)
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }
    
    if (!formData.event_date) {
      alert('행사 날짜를 선택해주세요.');
      return;
    }
    
    if (!formData.category) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    
    if (!formData.contactPhone) {
      alert('연락처를 입력해주세요.');
      return;
    }

    if (formData.registration_required && !formData.registration_deadline) {
      alert('신청 마감일을 설정해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        contact_info: formData.contactPhone + (formData.contactEmail ? ` | ${formData.contactEmail}` : ''),
        max_participants: formData.max_participants || null,
        registration_deadline: formData.registration_required ? formData.registration_deadline : null,
        status: 'upcoming' as const
      };
      
      await communityService.createChurchEvent(submitData);
      alert('행사가 성공적으로 등록되었습니다.');
      navigate('/community/church-events');
    } catch (error) {
      console.error('Failed to create church event:', error);
      alert('행사 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">행사 소식 등록</h1>
          <button
            onClick={() => navigate('/community/church-events')}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            목록으로
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="행사 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">카테고리를 선택하세요</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                행사 날짜 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="event_date"
                value={formData.event_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                행사 시간
              </label>
              <input
                type="time"
                name="event_time"
                value={formData.event_time}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                장소
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="행사 장소를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                참가비 (원)
              </label>
              <input
                type="number"
                name="fee"
                value={formData.fee}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                연령 제한
              </label>
              <select
                name="age_restriction"
                value={formData.age_restriction}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ageRestrictions.map((age) => (
                  <option key={age} value={age}>
                    {age}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="010-1234-5678"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 (선택)
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="registration_required"
                name="registration_required"
                checked={formData.registration_required}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="registration_required" className="text-sm font-medium text-gray-700">
                사전 신청 필요
              </label>
            </div>

            {formData.registration_required && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    신청 마감일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="registration_deadline"
                    value={formData.registration_deadline}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={formData.registration_required}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    최대 참가자 수
                  </label>
                  <input
                    type="number"
                    name="max_participants"
                    value={formData.max_participants || ''}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="제한 없음"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="행사에 대한 자세한 내용을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              특이사항
            </label>
            <textarea
              name="special_notes"
              value={formData.special_notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="준비물, 주의사항 등을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 첨부 (최대 5개, 각 10MB 이하)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.images.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.images.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/community/church-events')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChurchEvents;