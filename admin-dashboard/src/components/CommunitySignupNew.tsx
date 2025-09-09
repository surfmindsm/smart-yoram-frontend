import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { communityApplicationService, CommunityApplicationRequest } from '../services/communityApplicationService';

interface SignupFormData {
  applicantType: string;
  organizationName: string;
  contactPerson: string;
  email: string;
  password: string;
  passwordConfirm: string;
  phone: string;
  businessNumber: string;
  address: string;
  description: string;
  serviceArea: string;
  website: string;
  attachments: File[];
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}

const CommunitySignupNew: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    applicantType: '',
    organizationName: '',
    contactPerson: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    businessNumber: '',
    address: '',
    description: '',
    serviceArea: '',
    website: '',
    attachments: [],
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const navigate = useNavigate();

  const applicantTypes = [
    { value: 'company', label: '업체/회사' },
    { value: 'individual', label: '개인사업자' },
    { value: 'musician', label: '연주자/음악가' },
    { value: 'minister', label: '사역자' },
    { value: 'organization', label: '단체/기관' },
    { value: 'church_admin', label: '교회 관리자' },
    { value: 'other', label: '기타' }
  ];

  const handleInputChange = (field: keyof SignupFormData, value: string | boolean | File[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validationResult = communityApplicationService.validateFiles(files);
    
    if (!validationResult.isValid) {
      setError(validationResult.error || '파일 검증에 실패했습니다.');
      return;
    }
    
    handleInputChange('attachments', files);
  };

  const validateForm = (): boolean => {
    // 필수 필드 검증
    const requiredFields = [
      'applicantType', 'organizationName', 'contactPerson', 
      'email', 'password', 'passwordConfirm', 'phone', 'description'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof SignupFormData]) {
        setError(`${getFieldLabel(field)}은(는) 필수 입력 항목입니다.`);
        return false;
      }
    }

    // 이메일 유효성 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 주소를 입력해주세요.');
      return false;
    }

    // 비밀번호 유효성 검사
    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상 입력해주세요.');
      return false;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }

    // 전화번호 유효성 검사
    const phoneRegex = /^[0-9-+().\s]+$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('올바른 전화번호 형식을 입력해주세요.');
      return false;
    }

    // 필수 약관 동의 검사
    if (!formData.agreeTerms) {
      setError('서비스 이용약관에 동의해주세요.');
      return false;
    }

    if (!formData.agreePrivacy) {
      setError('개인정보처리방침에 동의해주세요.');
      return false;
    }

    return true;
  };

  const getFieldLabel = (field: string): string => {
    const labels: { [key: string]: string } = {
      applicantType: '신청자 유형',
      organizationName: '단체/회사명',
      contactPerson: '담당자명',
      email: '이메일',
      password: '비밀번호',
      passwordConfirm: '비밀번호 확인',
      phone: '연락처',
      description: '상세 소개 및 신청 사유'
    };
    return labels[field] || field;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // church_admin을 임시로 organization으로 매핑 (백엔드 수정 전까지)
    const mappedApplicantType = formData.applicantType === 'church_admin' 
      ? 'organization' 
      : formData.applicantType;

    const requestData: CommunityApplicationRequest = {
      applicant_type: mappedApplicantType as any,
      organization_name: formData.organizationName,
      contact_person: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      description: formData.description,
      business_number: formData.businessNumber || undefined,
      address: formData.address || undefined,
      service_area: formData.serviceArea || undefined,
      website: formData.website || undefined,
      // 임시로 파일 첨부 비활성화 (413 에러 테스트)
      // attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
      // 백엔드가 요구하는 새로운 필드들 추가
      password: formData.password,
      agree_terms: formData.agreeTerms,
      agree_privacy: formData.agreePrivacy,
      agree_marketing: formData.agreeMarketing
    };

    try {
      // 파일 첨부 기능이 다시 활성화됨
      console.log('🔍 전송할 데이터:', requestData);
      const result = await communityApplicationService.submitApplication(requestData);
      console.log('✅ 신청 완료:', result);
      setSuccess(true);
    } catch (err: any) {
      console.error('❌ 신청 실패:', err);
      console.error('❌ 전송한 데이터:', requestData);
      
      // 422 에러인 경우 상세 정보 표시
      if (err.response?.status === 422) {
        console.error('❌ 422 에러 상세:', err.response?.data);
        setError(`입력 데이터 오류: ${err.response?.data?.detail || err.message}`);
      } else {
        setError(err.message || '신청서 제출 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">신청 완료!</h2>
              <p className="text-gray-600">
                커뮤니티 이용 신청이 성공적으로 제출되었습니다.<br />
                관리자 검토 후 승인 결과를 이메일로 안내드리겠습니다.
              </p>
              <div className="pt-4">
                <Button onClick={() => navigate('/login')} className="w-full">
                  로그인 페이지로 이동
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            로그인으로 돌아가기
          </Button>
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">스마트 요람 커뮤니티 가입</CardTitle>
              <CardDescription>
                교회 관리자, 업체, 사역자 등 커뮤니티 회원으로 가입하여<br />
                다양한 교회 관련 서비스를 이용해보세요.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* 신청 폼 */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 기본 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">기본 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="applicantType">신청자 유형 *</Label>
                    <Select
                      value={formData.applicantType}
                      onValueChange={(value) => handleInputChange('applicantType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택해주세요" />
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

                  <div>
                    <Label htmlFor="organizationName">
                      {formData.applicantType === 'church_admin' ? '교회명' : '단체/회사명'} *
                    </Label>
                    <Input
                      id="organizationName"
                      value={formData.organizationName}
                      onChange={(e) => handleInputChange('organizationName', e.target.value)}
                      placeholder={formData.applicantType === 'church_admin' ? '○○교회' : '단체나 회사명을 입력하세요'}
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactPerson">
                      {formData.applicantType === 'church_admin' ? '담당 목사님/관리자' : '담당자명'} *
                    </Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                      placeholder="담당자 성함을 입력하세요"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">연락처 *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* 계정 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">계정 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="email">이메일 (로그인 ID) *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="example@example.com"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      이 이메일로 로그인하시게 됩니다.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="password">비밀번호 *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="8자 이상 입력하세요"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="passwordConfirm">비밀번호 확인 *</Label>
                    <div className="relative">
                      <Input
                        id="passwordConfirm"
                        type={showPasswordConfirm ? "text" : "password"}
                        value={formData.passwordConfirm}
                        onChange={(e) => handleInputChange('passwordConfirm', e.target.value)}
                        placeholder="비밀번호를 다시 입력하세요"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      >
                        {showPasswordConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 추가 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">추가 정보</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.applicantType !== 'individual' && formData.applicantType !== 'church_admin' && (
                    <div>
                      <Label htmlFor="businessNumber">사업자등록번호</Label>
                      <Input
                        id="businessNumber"
                        value={formData.businessNumber}
                        onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                        placeholder="000-00-00000"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="serviceArea">
                      {formData.applicantType === 'church_admin' ? '교회 소재지' : '서비스 지역'}
                    </Label>
                    <Input
                      id="serviceArea"
                      value={formData.serviceArea}
                      onChange={(e) => handleInputChange('serviceArea', e.target.value)}
                      placeholder={formData.applicantType === 'church_admin' ? '서울시 강남구' : '서비스 제공 지역'}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="address">
                      {formData.applicantType === 'church_admin' ? '교회 주소' : '주소'}
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="주소를 입력하세요"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="website">웹사이트</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
              </div>

              {/* 상세 소개 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">
                    {formData.applicantType === 'church_admin' 
                      ? '교회 소개 및 관리자 신청 사유' 
                      : '상세 소개 및 이용 목적'} *
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={formData.applicantType === 'church_admin'
                      ? '교회에 대한 간단한 소개와 스마트 요람 시스템을 사용하고자 하는 이유를 적어주세요.'
                      : '제공하시는 서비스나 이용 목적에 대해 상세히 작성해주세요.'
                    }
                    className="min-h-[120px]"
                  />
                </div>
              </div>

              {/* 첨부파일 */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="attachments">첨부파일</Label>
                  <div className="mt-1">
                    <Input
                      id="attachments"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      {formData.applicantType === 'church_admin' 
                        ? '교회 등록증, 교회 소개자료 등 (최대 5개, 각 5MB 이하)'
                        : '사업자등록증, 회사소개서, 포트폴리오 등 (최대 5개, 각 5MB 이하)'
                      }
                    </p>
                    {formData.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="text-sm text-gray-600 flex items-center">
                            <Upload className="w-4 h-4 mr-1" />
                            {file.name} ({(file.size / 1024).toFixed(1)}KB)
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 약관 동의 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">약관 동의</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => handleInputChange('agreeTerms', !!checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="agreeTerms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        서비스 이용약관 동의 (필수) *
                      </label>
                      <p className="text-xs text-muted-foreground">
                        <Link to="/terms" target="_blank" className="text-blue-600 hover:underline">
                          이용약관 보기
                        </Link>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreePrivacy"
                      checked={formData.agreePrivacy}
                      onCheckedChange={(checked) => handleInputChange('agreePrivacy', !!checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="agreePrivacy"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        개인정보처리방침 동의 (필수) *
                      </label>
                      <p className="text-xs text-muted-foreground">
                        <Link to="/privacy" target="_blank" className="text-blue-600 hover:underline">
                          개인정보처리방침 보기
                        </Link>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeMarketing"
                      checked={formData.agreeMarketing}
                      onCheckedChange={(checked) => handleInputChange('agreeMarketing', !!checked)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="agreeMarketing"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        마케팅 정보 수신 동의 (선택)
                      </label>
                      <p className="text-xs text-muted-foreground">
                        새로운 서비스나 이벤트 소식을 이메일로 받아보시겠어요?
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 제출 버튼 */}
              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      신청서 제출 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      가입 신청하기
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunitySignupNew;