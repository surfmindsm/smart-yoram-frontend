import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui";
import { 
  Save, 
  X, 
  Upload, 
  Calendar, 
  Clock,
  MapPin, 
  Users, 
  FileText,
  Bell,
  Star,
  Megaphone,
  Tag
} from 'lucide-react';
import { communityService, type ChurchNews } from '../../services/communityService';

const CreateChurchNews: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '특별예배',
    priority: 'normal',
    eventDate: '',
    eventTime: '',
    location: '',
    organizer: '',
    targetAudience: '',
    participationFee: '',
    registrationRequired: false,
    registrationDeadline: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    status: 'active',
    tags: [] as string[],
    images: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');

  const categories = [
    // 예배/집회 관련
    { value: '특별예배', label: '특별예배/연합예배' },
    { value: '부흥회', label: '부흥회/말씀집회' },
    { value: '기도회', label: '기도회/철야기도회' },
    { value: '성례식', label: '성찬식/세례식' },
    // 교육/양육 행사
    { value: '성경공부', label: '성경공부/제자훈련' },
    { value: '세미나', label: '세미나/워크숍' },
    { value: '수련회', label: '수련회/성경학교' },
    { value: '신앙강좌', label: '신앙강좌/성경퀴즈' },
    // 친교/봉사 행사
    { value: '친교행사', label: '바자회/플리마켓' },
    { value: '체육행사', label: '야유회/체육대회' },
    { value: '봉사활동', label: '지역봉사/선교행사' },
    { value: '전도행사', label: '전도집회/노방전도' },
    // 문화/미디어 행사
    { value: '찬양행사', label: '찬양집회/음악회' },
    { value: '공연행사', label: '연극/뮤지컬' },
    { value: '미디어행사', label: '방송/음향 박람회' },
    { value: '전시행사', label: '영상/사진 전시' },
    // 기타 공동체 행사
    { value: '창립기념', label: '창립기념행사' },
    { value: '절기행사', label: '절기행사(성탄/부활절)' },
    { value: '예식행사', label: '결혼예배/장례예배' },
    { value: '리더십', label: '리더십수련회/임직식' },
    { value: '기타', label: '기타' }
  ];

  const priorities = [
    { value: 'urgent', label: '긴급', icon: <Bell className="w-4 h-4" />, color: 'text-red-600' },
    { value: 'important', label: '중요', icon: <Star className="w-4 h-4" />, color: 'text-orange-600' },
    { value: 'normal', label: '일반', icon: <Megaphone className="w-4 h-4" />, color: 'text-blue-600' }
  ];

  const statusOptions = [
    { value: 'active', label: '진행중' },
    { value: 'completed', label: '완료' },
    { value: 'cancelled', label: '취소' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.organizer.trim()) {
      alert('제목, 내용, 주최자는 필수 입력 항목입니다.');
      return;
    }

    try {
      setLoading(true);
      
      const newsData: Partial<ChurchNews> = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        priority: formData.priority as 'urgent' | 'important' | 'normal',
        organizer: formData.organizer.trim(),
        eventDate: formData.eventDate || undefined,
        eventTime: formData.eventTime || undefined,
        location: formData.location || undefined,
        targetAudience: formData.targetAudience || undefined,
        participationFee: formData.participationFee || undefined,
        registrationRequired: formData.registrationRequired,
        registrationDeadline: formData.registrationDeadline || undefined,
        contactPerson: formData.contactPerson || undefined,
        contactPhone: formData.contactPhone || undefined,
        contactEmail: formData.contactEmail || undefined,
        status: formData.status as 'active' | 'completed' | 'cancelled',
        tags: formData.tags || [],
        images: formData.images || []
      };
      
      console.log('제출할 데이터:', newsData);
      
      await communityService.createChurchNews(newsData);
      
      alert('행사 소식이 등록되었습니다.');
      navigate('/community/church-news');
      
    } catch (error: any) {
      console.error('행사 소식 등록 실패:', error);
      alert(`등록 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (formData.title || formData.content) {
      if (window.confirm('작성 중인 내용이 삭제됩니다. 계속하시겠습니까?')) {
        navigate('/community/church-news');
      }
    } else {
      navigate('/community/church-news');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">행사 소식 등록</h1>
          <p className="text-gray-600 mt-1">새로운 교회 행사 소식을 등록하세요</p>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" />
            취소
          </Button>
          <Button
            type="submit"
            form="news-form"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            등록하기
          </Button>
        </div>
      </div>

      {/* 폼 */}
      <form id="news-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* 기본 정보 */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="행사 소식의 제목을 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                내용 *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="행사 소식의 상세 내용을 입력하세요"
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* 카테고리와 우선순위 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  우선순위
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {priorities.map(priority => (
                    <label key={priority.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={priority.value}
                        checked={formData.priority === priority.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <div className={`
                        p-3 border-2 rounded-lg text-center transition-all
                        ${formData.priority === priority.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}>
                        <div className={`flex items-center justify-center mb-1 ${priority.color}`}>
                          {priority.icon}
                        </div>
                        <div className="text-sm font-medium">{priority.label}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* 행사 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  행사일
                </label>
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  행사 시간
                </label>
                <input
                  type="time"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  장소
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="행사가 열리는 장소"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  주최자/부서 *
                </label>
                <input
                  type="text"
                  name="organizer"
                  value={formData.organizer}
                  onChange={handleInputChange}
                  placeholder="행사를 주최하는 부서나 담당자"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대상
                </label>
                <input
                  type="text"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  placeholder="예: 전체, 청년부, 장년부 등"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  참가비
                </label>
                <input
                  type="text"
                  name="participationFee"
                  value={formData.participationFee}
                  onChange={handleInputChange}
                  placeholder="예: 무료, 10,000원 등"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사전 신청 필요
                </label>
                <select
                  name="registrationRequired"
                  value={formData.registrationRequired.toString()}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    registrationRequired: e.target.value === 'true'
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="false">필요 없음</option>
                  <option value="true">필요함</option>
                </select>
              </div>

              {formData.registrationRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    신청 마감일
                  </label>
                  <input
                    type="date"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* 연락처 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  담당자
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  placeholder="문의 담당자 이름"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  연락처
                </label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="010-0000-0000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="contact@church.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                태그
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="태그를 입력하세요"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  className="px-4"
                >
                  추가
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      #{tag}
                      <Button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        variant="ghost"
                        size="sm"
                        className="ml-2 text-blue-600 hover:text-blue-800 h-4 w-4 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 이미지 업로드 (추후 구현) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 첨부
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-2">이미지를 드래그하거나 클릭하여 업로드</p>
                <Button type="button" variant="outline" size="sm" disabled>
                  파일 선택 (추후 구현)
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* 미리보기 (추후 구현) */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <FileText className="w-5 h-5 inline mr-2" />
            미리보기
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-lg font-semibold text-gray-900 mb-2">
              {formData.title || '제목을 입력하세요'}
            </div>
            <div className="text-sm text-gray-600 mb-2 space-y-1">
              <div>
                <span className="font-medium">{formData.category}</span> • {formData.organizer || '주최자'}
                {formData.targetAudience && ` • 대상: ${formData.targetAudience}`}
              </div>
              {(formData.eventDate || formData.eventTime || formData.location) && (
                <div>
                  {formData.eventDate && `📅 ${formData.eventDate}`}
                  {formData.eventTime && ` ${formData.eventTime}`}
                  {formData.location && ` 📍 ${formData.location}`}
                </div>
              )}
              {(formData.participationFee || formData.registrationRequired) && (
                <div>
                  {formData.participationFee && `💰 참가비: ${formData.participationFee}`}
                  {formData.registrationRequired && formData.registrationDeadline && 
                    ` | ⏰ 신청마감: ${formData.registrationDeadline}`}
                </div>
              )}
              {(formData.contactPerson || formData.contactPhone || formData.contactEmail) && (
                <div>
                  {formData.contactPerson && `👤 담당자: ${formData.contactPerson}`}
                  {formData.contactPhone && ` 📞 ${formData.contactPhone}`}
                  {formData.contactEmail && ` 📧 ${formData.contactEmail}`}
                </div>
              )}
            </div>
            <div className="text-gray-700 whitespace-pre-wrap">
              {formData.content || '내용을 입력하세요'}
            </div>
            {formData.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateChurchNews;