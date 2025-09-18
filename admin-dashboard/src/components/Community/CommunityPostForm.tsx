import React, { useState } from 'react';
import { 
  ArrowLeft,
  Plus,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import { Button } from '../ui/button';
import { api, getApiUrl } from '../../services/api';

// 폼 필드 타입 정의
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'email' | 'tel' | 'date' | 'time' | 'number' | 'images';
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
      
      // 이미지 업로드
      let uploadedImageUrls: string[] = [];
      
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const formDataForUpload = new FormData();
          formDataForUpload.append('images', file);
          
          try {
            // 연속 요청 시 약간의 지연 추가 (첫 번째 제외)
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const response = await api.post(getApiUrl('/community/upload-image'), formDataForUpload, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            
            console.log(`🖼️ 이미지 ${i + 1} 업로드 응답:`, response.data);
            
            if (response.data && response.data.urls && response.data.urls.length > 0) {
              console.log(`✅ 이미지 ${i + 1} URL 추가:`, response.data.urls[0]);
              uploadedImageUrls.push(response.data.urls[0]);
            } else {
              console.warn(`⚠️ 이미지 ${i + 1} URL을 찾을 수 없음:`, response.data);
            }
          } catch (error) {
            console.error(`이미지 ${i + 1} 업로드 실패:`, error);
            throw new Error(`이미지 업로드에 실패했습니다. (${i + 1}/${imageFiles.length})`);
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
        } else {
          // 백엔드에서 요구하는 snake_case로 변환
          let backendFieldKey = field.key;
          if (field.key === 'contactInfo') {
            backendFieldKey = 'contact_info';
          } else if (field.key === 'contactPhone') {
            backendFieldKey = 'contact_phone';
          } else if (field.key === 'contactEmail') {
            backendFieldKey = 'contact_email';
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
      
      // API 요청
      const response = await api.post(getApiUrl(config.submitEndpoint), submitData);

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
            
            <div className="flex gap-2 overflow-x-auto pb-2">
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
                <div key={index} className="flex-shrink-0 relative">
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
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  
                  {/* 대표 이미지 표시 */}
                  {mainImageIndex === index && (
                    <div className="absolute top-1 left-1 bg-yellow-500 text-white rounded-full p-1">
                      <Star className="h-3 w-3" />
                    </div>
                  )}
                  
                  {/* 대표 이미지 설정 버튼 */}
                  {mainImageIndex !== index && (
                    <button
                      type="button"
                      onClick={() => setMainImage(index)}
                      className="absolute top-1 left-1 bg-black bg-opacity-50 text-white rounded px-1 text-xs hover:bg-opacity-70"
                    >
                      대표
                    </button>
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
            <select
              value={value}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={field.required}
            >
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
            >
              <X className="h-6 w-6" />
            </button>
            
            {imageFiles.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
                  disabled={selectedImageIndex === 0}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setSelectedImageIndex(Math.min(imageFiles.length - 1, selectedImageIndex + 1))}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 bg-black bg-opacity-50 rounded-full p-2"
                  disabled={selectedImageIndex === imageFiles.length - 1}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-50 px-3 py-1 rounded">
              {selectedImageIndex + 1} / {imageFiles.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityPostForm;