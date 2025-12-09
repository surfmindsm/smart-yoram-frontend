import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Trash
} from 'lucide-react';
import { Button, DatePicker } from "../ui";
import CustomSelect from '../common/CustomSelect';
import { api, getApiUrl } from '../../services/api';
import { communityService } from '../../services/communityService';
import { supabase } from '../../lib/supabase';
import { getCities, getDistricts, formatLocation } from '../../data/koreaLocations';

// 폼 필드 타입 정의
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'email' | 'tel' | 'date' | 'time' | 'number' | 'images' | 'location' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  multiline?: boolean;
  maxLength?: number;
  validation?: (value: any) => string | null;
}

// 게시글 타입별 설정
export interface PostTypeConfig {
  type: string;
  title: string;
  fields: FormField[];
  submitEndpoint: string;
  successMessage: string;
  listPath: string;
}

// 공통 폼 컴포넌트 Props
interface CommunityPostFormProps {
  config: PostTypeConfig;
  onCancel?: () => void;
}

const CommunityPostForm: React.FC<CommunityPostFormProps> = ({ config, onCancel }) => {
  // 폼 데이터 초기화
  const initFormData = () => {
    const data: { [key: string]: any } = {};
    config.fields.forEach(field => {
      if (field.type === 'images') {
        data[field.key] = [];
      } else if (field.type === 'select' && field.options) {
        data[field.key] = field.options[0]?.value || '';
      } else {
        data[field.key] = '';
      }
    });
    return data;
  };

  const [formData, setFormData] = useState(initFormData());
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [mainImageIndex, setMainImageIndex] = useState<number>(0);

  // 위치 선택 state
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');

  // 이미지 크기 제한 상수
  const MAX_SINGLE_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_TOTAL_IMAGES_SIZE = 15 * 1024 * 1024; // 15MB (백엔드 요청 제한 고려)

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 파일 크기를 사람이 읽기 쉬운 형태로 변환
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 현재 선택된 이미지들의 총 크기 계산
  const getTotalImageSize = (files: File[]): number => {
    return files.reduce((total, file) => total + file.size, 0);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // 파일 개수 제한 확인
    if (files.length > 12) {
      alert('최대 12장까지 업로드할 수 있습니다.');
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    
    // 각 파일 유효성 검사
    for (const file of files) {
      // 개별 파일 크기 확인
      if (file.size > MAX_SINGLE_IMAGE_SIZE) {
        alert(`개별 이미지 크기는 ${formatFileSize(MAX_SINGLE_IMAGE_SIZE)}를 초과할 수 없습니다.\n파일: ${file.name} (${formatFileSize(file.size)})`);
        return;
      }
      
      // 파일 형식 확인
      if (!allowedTypes.includes(file.type)) {
        alert(`지원하지 않는 파일 형식입니다. (${file.name})\nJPG, PNG, GIF 파일만 업로드할 수 있습니다.`);
        return;
      }
    }
    
    // 전체 이미지 크기 확인
    const totalSize = getTotalImageSize(files);
    if (totalSize > MAX_TOTAL_IMAGES_SIZE) {
      const currentSizeText = formatFileSize(totalSize);
      const maxSizeText = formatFileSize(MAX_TOTAL_IMAGES_SIZE);
      
      alert(`전체 이미지 크기가 제한을 초과합니다.\n현재: ${currentSizeText}\n제한: ${maxSizeText}\n\n이미지 개수를 줄이거나 더 작은 크기의 이미지를 선택해주세요.`);
      return;
    }
    
    setImageFiles(files);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    
    if (mainImageIndex >= newFiles.length) {
      setMainImageIndex(Math.max(0, newFiles.length - 1));
    }
  };

  const setMainImage = (index: number) => {
    setMainImageIndex(index);
  };

  const validateForm = () => {
    for (const field of config.fields) {
      if (field.required) {
        if (field.type === 'images') {
          if (imageFiles.length === 0) {
            alert(`${field.label}을(를) 등록해주세요.`);
            return false;
          }
        } else {
          const value = formData[field.key];
          if (!value || (typeof value === 'string' && !value.trim())) {
            alert(`${field.label}을(를) 입력해주세요.`);
            return false;
          }
        }
      }
      
      // 커스텀 유효성 검사
      if (field.validation) {
        const error = field.validation(formData[field.key]);
        if (error) {
          alert(error);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    handleUploadAndSubmit();
  };

  const handleUploadAndSubmit = async () => {
    try {
      setCreating(true);

      // 현재 사용자 정보 가져오기 (church_id 용)
      const { supabaseAuthService } = await import('../../services/supabaseAuthService');
      const currentUser = await supabaseAuthService.getCurrentUser();
      const churchId = currentUser?.profile?.church_id || 9998;

      // 이미지 업로드
      let uploadedImageUrls: string[] = [];

      if (imageFiles.length > 0) {
        setUploadingImages(true);
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];

          try {
            // 연속 요청 시 약간의 지연 추가 (첫 번째 제외)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }

            // 파일명 생성 (기존 패턴과 동일하게)
            const timestamp = new Date().toISOString().replace(/[:\-T]/g, '').split('.')[0];
            const randomId = Math.random().toString(36).substring(2, 10);
            const fileExtension = file.name.split('.').pop();
            const fileName = `community_church_${timestamp}_${randomId}.${fileExtension}`;
            const storagePath = `church_${churchId}/${fileName}`;

            console.log(`🖼️ 이미지 ${i + 1} Supabase Storage 업로드 시작:`, storagePath);

            // Supabase Storage에 업로드
            const { data, error } = await supabase.storage
              .from('community-images')
              .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) {
              console.error(`❌ 이미지 ${i + 1} Supabase 업로드 실패:`, error);
              throw error;
            }

            // 공개 URL 생성
            const { data: publicUrlData } = supabase.storage
              .from('community-images')
              .getPublicUrl(storagePath);

            const publicUrl = publicUrlData.publicUrl;
            console.log(`✅ 이미지 ${i + 1} 업로드 완료:`, publicUrl);
            uploadedImageUrls.push(publicUrl);

          } catch (error) {
            console.error(`이미지 ${i + 1} 업로드 실패:`, error);
            console.warn(`⚠️ 이미지 업로드 실패, 해당 이미지 건너뛰기: ${file.name}`);
            // 업로드 실패시 해당 이미지 건너뛰기
            continue;
          }
        }
        
        setUploadingImages(false);
        console.log(`📸 총 업로드된 이미지 개수: ${uploadedImageUrls.length}`);
        console.log(`📸 업로드된 이미지 URLs:`, uploadedImageUrls);
      }
      
      // 폼 데이터 준비
      const submitData: { [key: string]: any } = {};

      config.fields.forEach(field => {
        if (field.type === 'images') {
          submitData[field.key] = uploadedImageUrls;
          if (uploadedImageUrls.length > 0) {
            submitData['main_image_index'] = mainImageIndex;
          }
        } else if (field.type === 'location') {
          // location 필드는 기존 location에 저장하고, province와 district도 별도로 저장
          submitData.location = formData[field.key];
          submitData.province = selectedCity || null;
          submitData.district = selectedDistrict || null;
        } else if (field.type === 'checkbox' && field.key === 'deliveryAvailable') {
          // deliveryAvailable은 snake_case로 변환
          submitData.deliveryAvailable = formData[field.key] === true || formData[field.key] === 'true';
        } else {
          // 백엔드에서 요구하는 snake_case로 변환
          let backendFieldKey = field.key;
          if (field.key === 'contactInfo') {
            backendFieldKey = 'contact_phone';
          } else if (field.key === 'contactPhone') {
            backendFieldKey = 'contact_phone';
          } else if (field.key === 'contactEmail') {
            backendFieldKey = 'contact_email';
          } else if (field.key === 'description' && config.type === 'church-news') {
            backendFieldKey = 'content'; // church-news에서는 description을 content로 매핑
          }

          // 이메일이 비어있으면 필드를 전송하지 않음
          if (field.key === 'contactEmail' && (!formData[field.key] || formData[field.key].trim() === '')) {
            // 빈 이메일은 전송하지 않음
          } else {
            submitData[backendFieldKey] = formData[field.key];
          }
        }
      });
      
      console.log(`🚀 최종 제출 데이터:`, submitData);
      console.log(`🚀 이미지 데이터:`, submitData.images);

      let response;

      // 무료나눔, 물품판매, 물품요청, 구인공고인 경우 communityService 사용, 나머지는 기존 API 사용
      if (config.type === 'free-sharing') {
        console.log(`📝 무료나눔: communityService.createSharingItem 사용`);
        const result = await communityService.createSharingItem(submitData);
        response = { data: result, status: 201 };
      } else if (config.type === 'item-sale') {
        console.log(`📝 물품판매: communityService.createOfferItem 사용`);
        const result = await communityService.createOfferItem(submitData);
        response = { data: result, status: 201 };
      } else if (config.type === 'item-request') {
        console.log(`📝 물품요청: communityService.createRequestItem 사용`);
        const result = await communityService.createRequestItem(submitData);
        response = { data: result, status: 201 };
      } else if (config.type === 'job-posting') {
        console.log(`📝 구인공고: communityService.createJobPost 사용`);
        const result = await communityService.createJobPost(submitData);
        response = { data: result, status: 201 };
      } else if (config.type === 'music-team-recruit') {
        console.log(`📝 찬양팀모집: communityService.createMusicRecruitment 사용`);
        const result = await communityService.createMusicRecruitment(submitData);
        response = { data: result, status: 201 };
      } else if (config.type === 'music-team-seeking') {
        console.log(`📝 찬양팀지원: communityService.createMusicSeeker 사용`);
        const result = await communityService.createMusicSeeker(submitData);
        response = { data: result, status: 201 };
      } else if (config.type === 'church-news') {
        console.log(`📝 교회소식: communityService.createChurchNews 사용`);
        const result = await communityService.createChurchNews(submitData);
        response = { data: result, status: 201 };
      } else {
        // 기존 API 요청
        console.log(`📝 기타 타입: 기존 API 사용 - ${config.submitEndpoint}`);
        response = await api.post(getApiUrl(config.submitEndpoint), submitData);
      }

      console.log(`🔍 API 응답 전체:`, response);
      console.log(`🔍 API 응답 데이터:`, response.data);
      console.log(`🔍 API 응답 상태:`, response.status);
      console.log(`🔍 success 필드:`, response.data?.success);

      if (response.data && (response.data.success || response.status === 200 || response.status === 201)) {
        alert(config.successMessage);
        window.location.href = config.listPath;
      } else {
        console.error(`❌ 등록 실패 - 응답 구조가 예상과 다름:`, response.data);
        throw new Error('등록에 실패했습니다.');
      }
      
    } catch (error: any) {
      console.error('등록 실패:', error);
      
      // 413 에러 (Request Entity Too Large) 특별 처리
      if (error.response?.status === 413) {
        const totalSize = getTotalImageSize(imageFiles);
        alert(`업로드 용량이 서버 제한을 초과했습니다.\n\n현재 이미지 총 크기: ${formatFileSize(totalSize)}\n서버 제한: ${formatFileSize(MAX_TOTAL_IMAGES_SIZE)}\n\n해결방법:\n- 이미지 개수를 줄여주세요\n- 더 작은 크기의 이미지를 사용해주세요\n- 이미지를 압축해주세요`);
      } else {
        alert(error.message || '등록에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setCreating(false);
      setUploadingImages(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.key];
    
    switch (field.type) {
      case 'images':
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} ({imageFiles.length}/12)
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {imageFiles.length > 0 && (
                <span className="ml-2 text-xs text-gray-500">
                  총 크기: {formatFileSize(getTotalImageSize(imageFiles))} / {formatFileSize(MAX_TOTAL_IMAGES_SIZE)}
                </span>
              )}
            </label>
            
            <div className="flex gap-2 overflow-x-auto pb-2 pt-2 px-2 -mx-2">
              {/* 이미지 업로드 버튼 */}
              <div className="flex-shrink-0">
                <label className="block">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50">
                    <Plus className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 text-center">이미지 추가</span>
                    <span className="text-xs text-gray-400 text-center mt-1">
                      최대 {formatFileSize(MAX_SINGLE_IMAGE_SIZE)}
                    </span>
                  </div>
                </label>
              </div>

              {/* 선택된 이미지들 */}
              {imageFiles.map((file, index) => (
                <div key={index} className="flex-shrink-0 relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`미리보기 ${index + 1}`}
                    className="w-32 h-32 object-cover rounded-lg cursor-pointer"
                    onClick={() => setSelectedImageIndex(index)}
                  />

                  {/* 파일 크기 표시 */}
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                    {formatFileSize(file.size)}
                  </div>

                  {/* 삭제 버튼 */}
                  <Button
                    type="button"
                    onClick={() => removeImage(index)}
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 rounded-full h-6 w-6 p-0 z-10 shadow-lg opacity-90 hover:opacity-100"
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                  
                  {/* 대표 이미지 표시 */}
                  {mainImageIndex === index && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white rounded-full p-1 z-10 shadow-lg">
                      <Star className="h-3 w-3" />
                    </div>
                  )}

                  {/* 대표 이미지 설정 버튼 */}
                  {mainImageIndex !== index && (
                    <Button
                      type="button"
                      onClick={() => setMainImage(index)}
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 left-1 bg-black bg-opacity-50 text-white rounded px-1 text-xs hover:bg-opacity-70 h-auto z-10 shadow-lg"
                    >
                      대표
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'select':
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <CustomSelect
              options={field.options || []}
              value={value}
              onChange={(value) => handleInputChange(field.key, value)}
              placeholder={`${field.label} 선택`}
            />
          </div>
        );
        
      case 'textarea':
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px]"
              maxLength={field.maxLength}
              required={field.required}
            />
            {field.maxLength && (
              <div className="text-right text-xs text-gray-500 mt-1">
                {value?.length || 0}/{field.maxLength}
              </div>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <DatePicker
              value={value}
              onChange={(newValue) => handleInputChange(field.key, newValue)}
              placeholder={field.placeholder || "날짜를 선택해주세요"}
            />
          </div>
        );

      case 'location':
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="flex">
              <CustomSelect
                options={getCities().map(city => ({ value: city, label: city }))}
                value={selectedCity}
                onChange={(city) => {
                  setSelectedCity(city);
                  setSelectedDistrict('');
                  handleInputChange(field.key, formatLocation(city));
                }}
                placeholder="도/시 선택"
                className="pr-2"
              />
              <CustomSelect
                options={getDistricts(selectedCity).map(district => ({ value: district, label: district }))}
                value={selectedDistrict}
                onChange={(district) => {
                  setSelectedDistrict(district);
                  handleInputChange(field.key, formatLocation(selectedCity, district));
                }}
                placeholder="시/군/구 선택"
                disabled={!selectedCity}
              />
            </div>
            {value && (
              <p className="text-sm text-gray-600 mt-1">선택된 지역: {value}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.key}>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={value === true || value === 'true'}
                onChange={(e) => handleInputChange(field.key, e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
          </div>
        );

      default:
        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              maxLength={field.maxLength}
              required={field.required}
            />
            {field.maxLength && (
              <div className="text-right text-xs text-gray-500 mt-1">
                {value?.length || 0}/{field.maxLength}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center mb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (onCancel) {
              onCancel();
            } else {
              window.history.back();
            }
          }}
          className="flex items-center gap-2 mr-4"
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
      </div>

      {/* 폼 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {config.fields.map(renderField)}
          
          {/* 제출 버튼 */}
          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  window.history.back();
                }
              }}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={creating || uploadingImages}
            >
              {uploadingImages 
                ? '이미지 업로드 중...' 
                : creating 
                ? '등록 중...' 
                : '등록하기'}
            </Button>
          </div>
        </form>
      </div>

      {/* 이미지 상세보기 모달 */}
      {selectedImageIndex !== null && imageFiles[selectedImageIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setSelectedImageIndex(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img
              src={URL.createObjectURL(imageFiles[selectedImageIndex])}
              alt={`미리보기 ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* 우상단 버튼들 */}
            <div className="absolute top-4 right-4 flex gap-2">
              {/* 삭제 버튼 */}
              <Button
                onClick={() => {
                  removeImage(selectedImageIndex);
                  if (selectedImageIndex >= imageFiles.length - 1) {
                    setSelectedImageIndex(Math.max(0, selectedImageIndex - 1));
                  }
                  if (imageFiles.length <= 1) {
                    setSelectedImageIndex(null);
                  }
                }}
                variant="destructive"
                size="sm"
                className="text-white hover:text-gray-300 bg-red-600 hover:bg-red-700 rounded-full h-10 w-10 p-0"
              >
                <Trash className="h-4 w-4" />
              </Button>

              {/* 닫기 버튼 */}
              <Button
                onClick={() => setSelectedImageIndex(null)}
                variant="ghost"
                size="sm"
                className="text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full h-10 w-10 p-0"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            {imageFiles.length > 1 && (
              <>
                <Button
                  onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full h-10 w-10 p-0"
                  disabled={selectedImageIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  onClick={() => setSelectedImageIndex(Math.min(imageFiles.length - 1, selectedImageIndex + 1))}
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full h-10 w-10 p-0"
                  disabled={selectedImageIndex === imageFiles.length - 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            
            {/* 하단 정보 영역 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3">
              {/* 이미지 번호 */}
              <div className="text-white bg-black bg-opacity-50 px-3 py-1 rounded">
                {selectedImageIndex + 1} / {imageFiles.length}
              </div>

              {/* 대표 이미지 설정/표시 */}
              {mainImageIndex === selectedImageIndex ? (
                <div className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1 rounded">
                  <Star className="h-4 w-4" />
                  <span className="text-sm">대표 이미지</span>
                </div>
              ) : (
                <Button
                  onClick={() => setMainImage(selectedImageIndex)}
                  variant="ghost"
                  size="sm"
                  className="text-white bg-black bg-opacity-50 hover:bg-opacity-70 px-3 py-1 rounded text-sm"
                >
                  대표로 설정
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPostForm;