import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus
} from 'lucide-react';
import { Button, DatePicker } from "../ui";
import { Spinner } from "../ui/spinner";
import CustomSelect, { SelectOption } from '../common/CustomSelect';
import { communityService } from '../../services/communityService';
import { getCities, getDistricts, formatLocation } from '../../data/koreaLocations';

const CreateItemRequest: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requestedItem: '',
    category: '',
    quantity: 1,
    reason: '',
    neededDate: '',
    urgency: 'medium' as 'high' | 'medium' | 'low',
    location: '',
    contactPhone: '',
    contactEmail: '',
    maxBudget: ''
  });

  // 위치 선택 state
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  const categories: SelectOption[] = [
    { value: 'furniture', label: '가구' },
    { value: 'electronics', label: '전자제품' },
    { value: 'books', label: '도서' },
    { value: 'instruments', label: '악기' },
    { value: 'sports', label: '스포츠용품' },
    { value: 'household', label: '생활용품' },
    { value: 'other', label: '기타' }
  ];

  const urgencyOptions: SelectOption[] = [
    { value: 'low', label: '여유' },
    { value: 'medium', label: '보통' },
    { value: 'high', label: '긴급' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.requestedItem || !formData.category || !formData.neededDate || !formData.contactPhone) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const requestData = {
        ...formData,
        contactInfo: formData.contactPhone + (formData.contactEmail ? ` | ${formData.contactEmail}` : ''),
        status: 'requesting' as const
      };

      await communityService.createRequestItem(requestData);
      alert('물품 요청이 등록되었습니다.');
      navigate('/community/item-request');
    } catch (error) {
      console.error('등록 실패:', error);
      alert('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/community/item-request')}
          className="flex items-center gap-2 mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">물품 요청 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* 기본 정보 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">요청 정보</h2>
            
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="요청할 물품의 제목을 입력하세요"
                required
              />
            </div>

            {/* 요청 물품과 카테고리 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  요청 물품 *
                </label>
                <input
                  type="text"
                  value={formData.requestedItem}
                  onChange={(e) => setFormData({...formData, requestedItem: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="구체적인 물품명을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 *
                </label>
                <CustomSelect
                  options={categories}
                  value={formData.category}
                  onChange={(value) => setFormData({...formData, category: value})}
                  placeholder="카테고리 선택"
                />
              </div>
            </div>

            {/* 수량과 우선순위 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수량
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  우선순위
                </label>
                <CustomSelect
                  options={urgencyOptions}
                  value={formData.urgency}
                  onChange={(value) => setFormData({...formData, urgency: value as 'high' | 'medium' | 'low'})}
                  placeholder="우선순위 선택"
                />
              </div>
            </div>

            {/* 필요일과 예산 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  필요일 *
                </label>
                <DatePicker
                  value={formData.neededDate}
                  onChange={(value) => setFormData({...formData, neededDate: value})}
                  placeholder="필요일을 선택해주세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최대 예산 (선택)
                </label>
                <input
                  type="text"
                  value={formData.maxBudget}
                  onChange={(e) => setFormData({...formData, maxBudget: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 50,000원"
                />
              </div>
            </div>

            {/* 거래 지역 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                거래 지역
              </label>
              <div className="flex">
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
                <p className="text-sm text-gray-600 mt-1">선택된 지역: {formData.location}</p>
              )}
            </div>

            {/* 필요 이유 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                필요 이유
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="물품이 필요한 이유를 간단히 설명해주세요"
              />
            </div>

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
                placeholder="원하는 물품의 상세한 조건이나 상태를 설명해주세요"
              />
            </div>

            {/* 연락처 */}
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
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">💡 물품 요청 안내</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 구체적인 물품명과 조건을 명시하면 더 좋은 응답을 받을 수 있습니다.</li>
            <li>• 필요일을 정확히 입력하여 적절한 시점에 연락받으세요.</li>
            <li>• 예산 범위를 제시하면 적절한 거래가 이루어질 수 있습니다.</li>
          </ul>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/community/item-request')}
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
                요청 등록
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateItemRequest;