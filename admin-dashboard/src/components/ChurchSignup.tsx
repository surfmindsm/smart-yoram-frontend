import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "./ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui";
import { Input } from "./ui";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { Checkbox } from "./ui";
import { Alert, AlertDescription } from "./ui";
import { Spinner } from "./ui/spinner";
import { ArrowLeft, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { churchApplicationService, ChurchApplicationRequest } from '../services/churchApplicationService';
import { supabaseApiService } from '../services/supabaseApiService';

interface SignupFormData {
  churchName: string;
  pastorName: string;
  adminName: string;
  email: string;
  emailVerificationCode: string;
  phone: string;
  address: string;
  website: string;
  establishedYear: string;
  denomination: string;
  memberCount: string;
  attachments: File[];
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}

const ChurchSignup: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    churchName: '',
    pastorName: '',
    adminName: '',
    email: '',
    emailVerificationCode: '',
    phone: '',
    address: '',
    website: '',
    establishedYear: '',
    denomination: '',
    memberCount: '',
    attachments: [],
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false
  });

  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerificationLoading, setEmailVerificationLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field: keyof SignupFormData, value: string | boolean | File[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validationResult = churchApplicationService.validateFiles(files);

    if (!validationResult.isValid) {
      setError(validationResult.error || '파일 검증에 실패했습니다.');
      return;
    }

    handleInputChange('attachments', files);
  };

  const sendEmailVerification = async () => {
    if (!formData.email) {
      setEmailError('이메일을 먼저 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setEmailError('올바른 이메일 형식을 입력해주세요.');
      return;
    }

    setEmailVerificationLoading(true);
    setEmailError('');

    try {
      const emailExists = await supabaseApiService.emailVerification.checkEmailExists(formData.email);

      if (emailExists) {
        setEmailError('이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.');
        return;
      }

      await supabaseApiService.emailVerification.sendCode(formData.email);
      setEmailVerificationSent(true);
      setEmailError('');
    } catch (err: any) {
      setEmailError(err.message || '이메일 인증 코드 발송에 실패했습니다.');
    } finally {
      setEmailVerificationLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!formData.emailVerificationCode) {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    if (formData.emailVerificationCode.length !== 6) {
      setError('인증 코드는 6자리 숫자입니다.');
      return;
    }

    try {
      await supabaseApiService.emailVerification.verifyCode(formData.email, formData.emailVerificationCode);
      setEmailVerified(true);
      setError('');
    } catch (err: any) {
      setError(err.message || '인증 코드가 올바르지 않습니다.');
    }
  };

  const validateForm = (): boolean => {
    if (!emailVerified) {
      setError('이메일 인증을 완료해주세요.');
      return false;
    }

    const requiredFields = [
      'churchName', 'pastorName', 'adminName', 'email', 'phone', 'address'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof SignupFormData]) {
        setError(`${getFieldLabel(field)}은(는) 필수 입력 항목입니다.`);
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('올바른 이메일 주소를 입력해주세요.');
      return false;
    }

    const phoneRegex = /^[0-9-+().\s]+$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('올바른 전화번호 형식을 입력해주세요.');
      return false;
    }

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
      churchName: '교회명',
      pastorName: '담임 목사님 이름',
      adminName: '계정 사용자 이름',
      email: '이메일',
      phone: '연락처',
      address: '교회 주소'
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

    const requestData: ChurchApplicationRequest = {
      church_name: formData.churchName,
      pastor_name: formData.pastorName,
      admin_name: formData.adminName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      description: '',
      agree_terms: formData.agreeTerms,
      agree_privacy: formData.agreePrivacy,
      agree_marketing: formData.agreeMarketing,
      website: formData.website || undefined,
      established_year: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
      denomination: formData.denomination || undefined,
      member_count: formData.memberCount ? parseInt(formData.memberCount) : undefined,
      attachments: formData.attachments.length > 0 ? formData.attachments : undefined
    };

    try {
      console.log('🔍 전송할 데이터:', requestData);
      const result = await churchApplicationService.submitApplication(requestData);
      console.log('✅ 신청 완료:', result);
      setSuccess(true);
    } catch (err: any) {
      console.error('❌ 신청 실패:', err);
      console.error('❌ 전송한 데이터:', requestData);

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
                교회 가입 신청이 성공적으로 제출되었습니다.<br />
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
              <CardTitle className="text-2xl">교회 관리자 가입</CardTitle>
              <CardDescription>
                Church Round 시스템으로 교회를 스마트하게 관리하세요.<br />
                가입 승인 후 교회 관리 기능을 모두 이용하실 수 있습니다.
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
                  <div className="md:col-span-2">
                    <Label htmlFor="churchName">교회명 *</Label>
                    <Input
                      id="churchName"
                      value={formData.churchName}
                      onChange={(e) => handleInputChange('churchName', e.target.value)}
                      placeholder="○○교회"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pastorName">담임 목사님 이름 *</Label>
                    <Input
                      id="pastorName"
                      value={formData.pastorName}
                      onChange={(e) => handleInputChange('pastorName', e.target.value)}
                      placeholder="홍길동 목사"
                    />
                    <p className="text-xs text-gray-500 mt-1">교회의 담임 목사님 성함</p>
                  </div>

                  <div>
                    <Label htmlFor="adminName">계정 사용자 이름 *</Label>
                    <Input
                      id="adminName"
                      value={formData.adminName}
                      onChange={(e) => handleInputChange('adminName', e.target.value)}
                      placeholder="김관리 집사"
                    />
                    <p className="text-xs text-gray-500 mt-1">실제 시스템을 관리할 사용자 이름</p>
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

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="email">이메일 (로그인 ID) *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="example@example.com"
                        disabled={emailVerified}
                        className={emailVerified ? 'bg-green-50 border-green-200' : ''}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={sendEmailVerification}
                        disabled={emailVerificationLoading || !formData.email || emailVerified}
                        className="min-w-[100px]"
                      >
                        {emailVerificationLoading ? '발송중...' : emailVerified ? '인증완료' : '인증코드'}
                      </Button>
                    </div>
                    {emailError && (
                      <p className="text-sm text-red-600 mt-1 flex items-center">
                        <X className="w-4 h-4 mr-1" />
                        {emailError}
                      </p>
                    )}
                    {emailVerified ? (
                      <p className="text-sm text-green-600 mt-1 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        이메일 인증이 완료되었습니다.
                      </p>
                    ) : !emailError && (
                      <p className="text-sm text-gray-500 mt-1">
                        승인 시 이 이메일로 로그인 정보를 발송드립니다.
                      </p>
                    )}
                  </div>

                  {emailVerificationSent && !emailVerified && (
                    <div>
                      <Label htmlFor="emailVerificationCode">이메일 인증 코드 *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="emailVerificationCode"
                          type="text"
                          value={formData.emailVerificationCode}
                          onChange={(e) => handleInputChange('emailVerificationCode', e.target.value)}
                          placeholder="6자리 인증 코드"
                          maxLength={6}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={verifyEmailCode}
                          disabled={!formData.emailVerificationCode || formData.emailVerificationCode.length !== 6}
                          className="min-w-[80px]"
                        >
                          확인
                        </Button>
                      </div>
                      <p className="text-sm text-blue-600 mt-1">
                        {formData.email}로 발송된 6자리 인증 코드를 입력해주세요.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 교회 상세 정보 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">교회 상세 정보</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="address">교회 주소 *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="서울시 강남구 ..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="denomination">교단/교파</Label>
                    <Input
                      id="denomination"
                      value={formData.denomination}
                      onChange={(e) => handleInputChange('denomination', e.target.value)}
                      placeholder="예: 예장통합, 기장, 순복음 등"
                    />
                  </div>

                  <div>
                    <Label htmlFor="establishedYear">설립연도</Label>
                    <Input
                      id="establishedYear"
                      type="number"
                      value={formData.establishedYear}
                      onChange={(e) => handleInputChange('establishedYear', e.target.value)}
                      placeholder="예: 1990"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div>
                    <Label htmlFor="memberCount">교인 수 (대략)</Label>
                    <Input
                      id="memberCount"
                      type="number"
                      value={formData.memberCount}
                      onChange={(e) => handleInputChange('memberCount', e.target.value)}
                      placeholder="예: 100"
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
                      교회 등록증, 교회 소개자료 등 (최대 5개, 각 5MB 이하)
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
                      <Spinner size="sm" variant="white" className="mr-2" />
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

export default ChurchSignup;
