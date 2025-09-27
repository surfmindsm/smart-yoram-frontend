import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Upload,
  X,
  Plus
} from 'lucide-react';
import { Button } from "../ui";
import { Input } from "../ui";
import { Label } from "../ui";
import { Textarea } from "../ui";
import CustomSelect, { SelectOption } from '../common/CustomSelect';
import { Card, CardContent, CardHeader, CardTitle } from "../ui";
import { Spinner } from "../ui/spinner";
import { communityService } from '../../services/communityService';

const CreateFreeSharing: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    quantity: 1,
    location: '',
    contactPhone: '',
    contactEmail: '',
    images: [] as string[]
  });

  const categories: SelectOption[] = [
    { value: 'furniture', label: '가구' },
    { value: 'electronics', label: '전자제품' },
    { value: 'books', label: '도서' },
    { value: 'clothing', label: '의류' },
    { value: 'toys', label: '장난감' },
    { value: 'household', label: '생활용품' },
    { value: 'other', label: '기타' }
  ];

  const conditions: SelectOption[] = [
    { value: 'new', label: '새 상품' },
    { value: 'like_new', label: '거의 새것' },
    { value: 'used', label: '사용감 있음' },
    { value: 'repair_needed', label: '수리 필요' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category || !formData.contactPhone) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      
      const sharingData = {
        ...formData,
        images: images,
        contactInfo: formData.contactPhone + (formData.contactEmail ? ` | ${formData.contactEmail}` : ''),
        status: 'available' as const
      };

      await communityService.createSharingItem(sharingData);
      alert('무료 나눔 게시글이 등록되었습니다.');
      navigate('/community/free-sharing');
    } catch (error) {
      console.error('등록 실패:', error);
      alert('등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImages(prev => [...prev, e.target!.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/community/free-sharing')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>
        <h1 className="text-3xl font-bold">무료 나눔(드림) 등록</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* 제목 */}
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="나눔할 물품의 제목을 입력하세요"
                required
              />
            </div>

            {/* 카테고리와 상태 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">카테고리 *</Label>
                <CustomSelect
                  options={categories}
                  value={formData.category}
                  onChange={(value) => setFormData({...formData, category: value})}
                  placeholder="카테고리 선택"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">상품 상태 *</Label>
                <CustomSelect
                  options={conditions}
                  value={formData.condition}
                  onChange={(value) => setFormData({...formData, condition: value})}
                  placeholder="상태 선택"
                />
              </div>
            </div>

            {/* 수량과 지역 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">수량</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">지역</Label>
                <Input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="거래 가능한 지역을 입력하세요"
                />
              </div>
            </div>

            {/* 상세 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">상세 설명 *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                placeholder="물품에 대한 자세한 설명을 입력하세요"
                required
              />
            </div>

            {/* 연락처 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPhone">연락처 <span className="text-red-500">*</span></Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                  placeholder="010-1234-5678"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">이메일 (선택)</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                  placeholder="example@email.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이미지 업로드 */}
        <Card>
          <CardHeader>
            <CardTitle>이미지</CardTitle>
          </CardHeader>
          <CardContent>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사진 업로드 (최대 5장)
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">클릭하여 업로드</span> 또는 드래그 앤 드롭
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF (최대 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={images.length >= 5}
                  />
                </label>
              </div>
            </div>

            {/* 업로드된 이미지 미리보기 */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`업로드된 이미지 ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/community/free-sharing')}
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
                등록하기
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateFreeSharing;