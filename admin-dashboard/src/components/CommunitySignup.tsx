import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { communityApplicationService, CommunityApplicationRequest } from '../services/communityApplicationService';

interface SignupFormData {
  applicantType: string;
  organizationName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessNumber: string;
  address: string;
  description: string;
  serviceArea: string;
  website: string;
  attachments: File[];
}

const CommunitySignup: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    applicantType: '',
    organizationName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessNumber: '',
    address: '',
    description: '',
    serviceArea: '',
    website: '',
    attachments: []
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const applicantTypes = [
    { value: 'company', label: '업체/회사' },
    { value: 'individual', label: '개인사업자' },
    { value: 'musician', label: '연주자/음악가' },
    { value: 'minister', label: '사역자' },
    { value: 'organization', label: '단체/기관' },
    { value: 'other', label: '기타' }
  ];

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // 파일 유효성 검사
    const validation = communityApplicationService.validateFiles(files);
    if (!validation.isValid) {
      setError(validation.error || '파일 업로드 오류');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
    setError(''); // 파일이 정상적으로 추가되면 에러 메시지 클리어
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 필수 필드 검증
      if (!formData.applicantType || !formData.organizationName || !formData.contactPerson || 
          !formData.email || !formData.phone || !formData.description) {
        throw new Error('필수 필드를 모두 입력해주세요.');
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('올바른 이메일 형식을 입력해주세요.');
      }

      // API 요청 데이터 구성
      const requestData: CommunityApplicationRequest = {
        applicant_type: formData.applicantType as CommunityApplicationRequest['applicant_type'],
        organization_name: formData.organizationName,
        contact_person: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        description: formData.description,
        // 기존 폼에는 없는 필수 필드들 - 기본값 설정
        password: 'temporary_password_123',
        agree_terms: true,
        agree_privacy: true,
        agree_marketing: false
      };

      // 선택적 필드 추가
      if (formData.businessNumber) requestData.business_number = formData.businessNumber;
      if (formData.address) requestData.address = formData.address;
      if (formData.serviceArea) requestData.service_area = formData.serviceArea;
      if (formData.website) requestData.website = formData.website;
      if (formData.attachments.length > 0) requestData.attachments = formData.attachments;

      // API 호출
      const result = await communityApplicationService.submitApplication(requestData);
      
      console.log('신청서 제출 성공:', result);
      setSuccess(true);
    } catch (err: any) {
      console.error('신청서 제출 실패:', err);
      setError(err.message || '신청 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-muted">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-xl">신청이 완료되었습니다!</CardTitle>
            <CardDescription>
              관리자 검토 후 승인 결과를 이메일로 안내드리겠습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">다음 단계</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 관리자가 신청 내용을 검토합니다 (1-2일 소요)</li>
                  <li>• 승인 시 로그인 정보를 이메일로 발송합니다</li>
                  <li>• 추가 문의사항이 있으시면 연락주세요</li>
                </ul>
              </div>
              <Button 
                onClick={handleBackToLogin}
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                로그인 페이지로 돌아가기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-muted">
          <CardHeader>
            <div className="flex items-center gap-4 mb-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleBackToLogin}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl">커뮤니티 회원 신청</CardTitle>
                <CardDescription>
                  스마트 요람 커뮤니티 이용을 위한 신청서입니다
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 신청자 유형 */}
              <div className="space-y-2">
                <Label htmlFor="applicantType">신청자 유형 *</Label>
                <Select 
                  value={formData.applicantType} 
                  onValueChange={(value) => handleInputChange('applicantType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="신청자 유형을 선택해주세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {applicantTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizationName">
                    {formData.applicantType === 'individual' ? '사업체명' : '단체/회사명'} *
                  </Label>
                  <Input
                    id="organizationName"
                    placeholder="단체/회사명을 입력해주세요"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange('organizationName', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">담당자명 *</Label>
                  <Input
                    id="contactPerson"
                    placeholder="담당자명을 입력해주세요"
                    value={formData.contactPerson}
                    onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 연락처 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">이메일 *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">연락처 *</Label>
                  <Input
                    id="phone"
                    placeholder="010-0000-0000"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* 사업자 정보 */}
              {(formData.applicantType === 'company' || formData.applicantType === 'individual') && (
                <div className="space-y-2">
                  <Label htmlFor="businessNumber">사업자등록번호</Label>
                  <Input
                    id="businessNumber"
                    placeholder="000-00-00000"
                    value={formData.businessNumber}
                    onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                  />
                </div>
              )}

              {/* 주소 */}
              <div className="space-y-2">
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  placeholder="사업장 주소를 입력해주세요"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              {/* 서비스 영역 */}
              <div className="space-y-2">
                <Label htmlFor="serviceArea">주요 활동 지역</Label>
                <Input
                  id="serviceArea"
                  placeholder="예: 서울/경기, 전국 등"
                  value={formData.serviceArea}
                  onChange={(e) => handleInputChange('serviceArea', e.target.value)}
                />
              </div>

              {/* 웹사이트 */}
              <div className="space-y-2">
                <Label htmlFor="website">웹사이트/SNS</Label>
                <Input
                  id="website"
                  placeholder="홈페이지나 소셜미디어 주소"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                />
              </div>

              {/* 상세 설명 */}
              <div className="space-y-2">
                <Label htmlFor="description">상세 소개 및 신청 사유 *</Label>
                <Textarea
                  id="description"
                  placeholder="사업 내용, 제공 서비스, 커뮤니티 이용 목적 등을 자세히 작성해주세요"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={5}
                  required
                />
              </div>

              {/* 첨부파일 */}
              <div className="space-y-2">
                <Label>첨부파일 (선택사항)</Label>
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <div className="text-sm text-gray-600 mb-2">
                        사업자등록증, 자격증, 포트폴리오 등
                      </div>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label 
                        htmlFor="file-upload"
                        className="cursor-pointer text-blue-600 hover:text-blue-500"
                      >
                        파일 선택
                      </Label>
                    </div>
                  </div>

                  {/* 첨부된 파일 목록 */}
                  {formData.attachments.length > 0 && (
                    <div className="space-y-2">
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            삭제
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? '신청 중...' : '신청하기'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunitySignup;