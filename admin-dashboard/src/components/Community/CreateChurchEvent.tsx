import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Plus,
  MapPin,
  Users,
  Calendar
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService } from '../../services/communityService';

const CreateChurchEvent: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventDate: '',
    location: '',
    maxParticipants: '',
    contactPhone: '',
    contactEmail: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.contactPhone) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        eventDate: formData.eventDate,
        location: formData.location,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        status: 'upcoming'
      };

      await communityService.createMusicRecruitment(eventData);
      alert('교회 행사가 등록되었습니다.');
      navigate('/community/music-team-recruit');
    } catch (error) {
      console.error('등록 실패:', error);
      alert('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 오늘 날짜를 YYYY-MM-DD 형식으로 가져오기
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
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
        <h1 className="text-2xl font-bold text-gray-900">교회 행사 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">행사 정보</h2>
            
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                행사 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 2024 부활절 특별예배"
                required
              />
            </div>

            {/* 상세 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                행사 설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="행사에 대한 상세한 설명을 입력해주세요"
              />
            </div>

            {/* 행사 일시와 장소 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  행사 일시
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={getTodayDate() + 'T00:00'}
                  />
                  <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  장소
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="예: 사랑교회 본당"
                  />
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* 최대 참가자 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최대 참가자 수
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({...formData, maxParticipants: e.target.value})}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 100"
                  min="1"
                />
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
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
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 교회 행사 등록 안내</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 행사 제목과 설명을 명확하게 작성해주세요.</li>
            <li>• 행사 일시와 장소를 정확히 입력해주세요.</li>
            <li>• 담당자 연락처는 정확히 입력해주세요.</li>
            <li>• 최대 참가자 수는 선택 사항입니다.</li>
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                등록 중...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                행사 등록
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateChurchEvent;