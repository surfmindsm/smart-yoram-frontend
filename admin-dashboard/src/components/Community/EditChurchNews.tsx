import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Bell, Star, Megaphone } from 'lucide-react';
import { Button } from "../ui";
import { communityService, ChurchNews } from '../../services/communityService';

const EditChurchNews: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

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
    { value: '멤버십', label: '멤버십/입교식' },
    { value: '축제', label: '교회 축제/기념행사' },
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

  useEffect(() => {
    if (id) {
      fetchChurchNews();
    }
  }, [id]);

  const fetchChurchNews = async () => {
    try {
      setInitialLoading(true);
      const newsId = parseInt(id!);
      const news = await communityService.getChurchNewsDetail(newsId);

      if (news) {
        setFormData({
          title: news.title,
          content: news.content,
          category: news.category,
          priority: news.priority || 'normal',
          eventDate: news.eventDate || '',
          eventTime: news.eventTime || '',
          location: news.location || '',
          organizer: news.organizer || '',
          targetAudience: news.targetAudience || '',
          participationFee: news.participationFee || '',
          registrationRequired: news.registrationRequired || false,
          registrationDeadline: news.registrationDeadline || '',
          contactPerson: news.contactPerson || '',
          contactPhone: news.contactPhone || '',
          contactEmail: news.contactEmail || '',
          status: (news.status || 'active') as 'active' | 'completed' | 'cancelled',
          tags: news.tags || [],
          images: news.images || []
        });
      } else {
        alert('교회 소식을 찾을 수 없습니다.');
        navigate('/community/my-posts');
      }
    } catch (error) {
      console.error('교회 소식 조회 실패:', error);
      alert('교회 소식 조회에 실패했습니다.');
      navigate('/community/my-posts');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.content || !formData.organizer) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);

      const newsData: Partial<ChurchNews> = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        priority: formData.priority as 'urgent' | 'important' | 'normal',
        eventDate: formData.eventDate || undefined,
        eventTime: formData.eventTime || undefined,
        location: formData.location || undefined,
        organizer: formData.organizer,
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

      console.log('수정할 데이터:', newsData);

      await communityService.updateChurchNews(parseInt(id!), newsData);

      alert('교회 소식이 수정되었습니다.');
      navigate('/community/my-posts');

    } catch (error: any) {
      console.error('교회 소식 수정 실패:', error);
      alert(`수정 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8 flex items-center justify-between bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/community/my-posts')}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">교회 소식 수정</h1>
            <p className="text-gray-600 mt-1">교회 소식 정보를 수정하세요</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            type="submit"
            form="news-form"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            수정하기
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

            {/* 상태 */}
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
          </div>
        </div>

        {/* 행사 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">행사 정보</h3>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  행사시간
                </label>
                <input
                  type="time"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
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
                placeholder="행사가 열릴 장소를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주최자/부서 *
              </label>
              <input
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleInputChange}
                placeholder="행사 주최자나 담당 부서를 입력하세요"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대상
                </label>
                <input
                  type="text"
                  name="targetAudience"
                  value={formData.targetAudience}
                  onChange={handleInputChange}
                  placeholder="참여 대상을 입력하세요"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  참가비
                </label>
                <input
                  type="text"
                  name="participationFee"
                  value={formData.participationFee}
                  onChange={handleInputChange}
                  placeholder="참가비를 입력하세요 (예: 무료, 10,000원)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  name="registrationRequired"
                  id="registrationRequired"
                  checked={formData.registrationRequired}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="registrationRequired" className="text-sm font-medium text-gray-700">
                  사전 등록 필요
                </label>
              </div>

              {formData.registrationRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    등록 마감일
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
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">연락처 정보</h3>
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
                placeholder="담당자 이름"
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
        </div>

        {/* 태그 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">태그</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="태그를 입력하고 Enter를 누르세요"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Button
                type="button"
                onClick={handleAddTag}
                variant="outline"
                size="sm"
              >
                추가
              </Button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
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

export default EditChurchNews;