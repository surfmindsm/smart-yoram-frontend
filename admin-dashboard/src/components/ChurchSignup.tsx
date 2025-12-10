import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "./ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui";
import { Input } from "./ui";
import { Label } from "./ui";
import { Textarea } from "./ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui";
import { Checkbox } from "./ui";
import { Alert, AlertDescription } from "./ui";
import { Spinner } from "./ui/spinner";
import { ArrowLeft, Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { churchApplicationService, ChurchApplicationRequest } from '../services/churchApplicationService';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabase } from '../lib/supabase';

interface SignupFormData {
  churchName: string;
  churchRegistrationNumber: string;
  pastorName: string;
  denomination: string;
  establishedYear: string;
  address: string;
  phone: string;
  adminName: string;
  adminPhone: string;
  email: string;
  emailVerificationCode: string;
  memberCount: string;
  homepageUrl: string;
  youtubeChannel: string;
  attachments: File[];
  agreeTerms: boolean;
  agreePrivacy: boolean;
  agreeMarketing: boolean;
}

const ChurchSignup: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    churchName: '',
    churchRegistrationNumber: '',
    pastorName: '',
    denomination: '',
    establishedYear: '',
    address: '',
    phone: '',
    adminName: '',
    adminPhone: '',
    email: '',
    emailVerificationCode: '',
    memberCount: '',
    homepageUrl: '',
    youtubeChannel: '',
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
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const denominations = [
    '기독교대한감리회',
    '기독교대한성결교회',
    '기독교대한하나님의성회(여의도순복음)',
    '기독교대한하나님의성회(서대문)',
    '기독교대한하나님의성회(광명)',
    '기독교대한하나님의성회(순복음)',
    '기독교한국루터회',
    '기독교한국침례회',
    '대한예수교장로회(개혁)',
    '대한예수교장로회(개혁총연)',
    '대한예수교장로회(고신)',
    '대한예수교장로회(대신)',
    '대한예수교장로회(대신수호)',
    '대한예수교장로회(백석)',
    '대한예수교장로회(백석대신)',
    '대한예수교장로회(보수)',
    '대한예수교장로회(서서울)',
    '대한예수교장로회(순장)',
    '대한예수교장로회(에덴)',
    '대한예수교장로회(통합)',
    '대한예수교장로회(합동)',
    '대한예수교장로회(합동보수)',
    '대한예수교장로회(합신)',
    '대한예수교장로회(호헌)',
    '대한예수교장로회(기타)',
    '대한예수교침례회',
    '성결교회(대한성결)',
    '성결교회(예수교성결)',
    '성결교회(나성)',
    '성결교회(기타)',
    '예수교대한하나님의교회',
    '예수교대한성결교회',
    '예수교한국침례회',
    '한국기독교장로회',
    '한국구세군',
    '한국루터회',
    '한국복음교회',
    '한국침례회',
    '독립교회',
    '무교단'
  ];

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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validationResult = churchApplicationService.validateFiles(files);

    if (!validationResult.isValid) {
      setError(validationResult.error || '파일 검증에 실패했습니다.');
      return;
    }

    handleInputChange('attachments', files);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const newFiles = formData.attachments.filter((_, index) => index !== indexToRemove);
    handleInputChange('attachments', newFiles);
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
      'churchName', 'pastorName', 'denomination', 'establishedYear', 'address', 'phone',
      'adminName', 'adminPhone', 'email'
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
      pastorName: '담임 목사명',
      denomination: '교단/교파',
      establishedYear: '설립연도',
      address: '교회 주소',
      phone: '교회 대표 번호',
      adminName: '계정 사용자명',
      adminPhone: '계정 사용자 연락처',
      email: '계정 사용자 이메일'
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

    try {
      // 0. 최종 제출 전 이메일 중복 체크 (추가 검증)
      console.log('📧 최종 이메일 중복 체크 시작...');
      const emailExists = await supabaseApiService.emailVerification.checkEmailExists(formData.email);

      if (emailExists) {
        setError('이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.');
        setLoading(false);
        return;
      }
      console.log('✅ 이메일 중복 체크 통과');

      // 1. 먼저 파일을 Supabase Storage에 업로드
      const uploadedAttachments: Array<{ filename: string; path: string; size: number; url: string }> = [];

      if (formData.attachments.length > 0) {
        console.log(`📎 ${formData.attachments.length}개 파일 업로드 시작...`);

        for (let i = 0; i < formData.attachments.length; i++) {
          const file = formData.attachments[i];
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const fileExtension = file.name.split('.').pop();
          const fileName = `application_${timestamp}_${randomString}.${fileExtension}`;
          const storagePath = `applications/${fileName}`;

          console.log(`📎 파일 ${i + 1} 업로드 시작: ${file.name} -> ${storagePath}`);

          try {
            // Supabase Storage에 업로드
            const { data, error } = await supabase.storage
              .from('church-application-files')
              .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (error) {
              console.error(`❌ 파일 ${i + 1} 업로드 실패:`, error);
              throw new Error(`파일 업로드 실패: ${file.name}`);
            }

            // 공개 URL 생성
            const { data: publicUrlData } = supabase.storage
              .from('church-application-files')
              .getPublicUrl(storagePath);

            const publicUrl = publicUrlData.publicUrl;
            console.log(`✅ 파일 ${i + 1} 업로드 완료:`, publicUrl);

            uploadedAttachments.push({
              filename: file.name,
              path: storagePath,
              size: file.size,
              url: publicUrl
            });

          } catch (uploadError: any) {
            console.error(`❌ 파일 ${i + 1} 업로드 중 오류:`, uploadError);
            setError(`파일 업로드 실패: ${file.name}. ${uploadError.message}`);
            setLoading(false);
            return;
          }
        }

        console.log(`✅ 총 ${uploadedAttachments.length}개 파일 업로드 완료`);
      }

      // 2. 신청서 데이터 준비 (파일 정보 포함)
      const requestData: ChurchApplicationRequest = {
        church_name: formData.churchName,
        pastor_name: formData.pastorName,
        admin_name: formData.adminName,
        admin_phone: formData.adminPhone,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        description: '',
        agree_terms: formData.agreeTerms,
        agree_privacy: formData.agreePrivacy,
        agree_marketing: formData.agreeMarketing,
        business_no: formData.churchRegistrationNumber || undefined,
        homepage_url: formData.homepageUrl || undefined,
        youtube_channel: formData.youtubeChannel || undefined,
        established_year: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
        denomination: formData.denomination || undefined,
        member_count: formData.memberCount ? parseInt(formData.memberCount) : undefined,
        // 업로드된 파일 정보를 attachments에 포함
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments as any : undefined
      };

      console.log('🔍 전송할 데이터:', requestData);

      // 3. 신청서 제출
      const result = await churchApplicationService.submitApplication(requestData);
      console.log('✅ 신청 완료:', result);

      // 4. 신청 알림 이메일 발송
      try {
        await supabaseApiService.notifyApplication.send(
          'church',
          formData.email,
          formData.adminName,
          formData.churchName,
          result.application_id
        );
        console.log('✅ 관리자 알림 이메일 발송 완료');
      } catch (notifyError) {
        console.error('⚠️ 알림 이메일 발송 실패 (신청은 완료됨):', notifyError);
        // 알림 발송 실패해도 신청은 성공으로 처리
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('❌ 신청 실패:', err);

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
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
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

                  <div className="md:col-span-2">
                    <Label htmlFor="churchRegistrationNumber">교회 고유번호</Label>
                    <Input
                      id="churchRegistrationNumber"
                      value={formData.churchRegistrationNumber}
                      onChange={(e) => handleInputChange('churchRegistrationNumber', e.target.value)}
                      placeholder="000-00-00000 (선택사항)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="pastorName">담임 목사명 *</Label>
                    <Input
                      id="pastorName"
                      value={formData.pastorName}
                      onChange={(e) => handleInputChange('pastorName', e.target.value)}
                      placeholder="홍길동 목사"
                    />
                  </div>

                  <div>
                    <Label htmlFor="denomination">교단/교파 *</Label>
                    <Select
                      value={formData.denomination}
                      onValueChange={(value) => handleInputChange('denomination', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선택해주세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {denominations.map((denomination) => (
                          <SelectItem key={denomination} value={denomination}>
                            {denomination}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="establishedYear">설립연도 *</Label>
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

                  <div className="md:col-span-2">
                    <Label htmlFor="address">교회 주소 *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="서울시 강남구 ..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="phone">교회 대표 번호 *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="02-1234-5678"
                    />
                  </div>
                </div>
              </div>

              {/* 계정 정보 (최고 관리자) */}
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">계정 정보 (최고 관리자)</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminName">계정 사용자명 *</Label>
                    <Input
                      id="adminName"
                      value={formData.adminName}
                      onChange={(e) => handleInputChange('adminName', e.target.value)}
                      placeholder="김관리 집사"
                    />
                  </div>

                  <div>
                    <Label htmlFor="adminPhone">계정 사용자 연락처 *</Label>
                    <Input
                      id="adminPhone"
                      value={formData.adminPhone}
                      onChange={(e) => handleInputChange('adminPhone', e.target.value)}
                      placeholder="010-0000-0000"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="email">계정 사용자 이메일 (로그인 ID) *</Label>
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
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-500">
                          승인 시 이 이메일로 로그인 정보를 발송드립니다.
                        </p>
                        <p className="text-xs text-gray-400">
                          인증코드가 오지 않으시나요? 메일 주소를 변경하여 테스트해보시거나, 아래로 연락주세요 😊
                        </p>
                        <p className="text-xs text-primary-600">
                          📞 010-6617-1875 | ✉️ contact@churchround.com
                        </p>
                      </div>
                    )}
                  </div>

                  {emailVerificationSent && !emailVerified && (
                    <div className="md:col-span-2">
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
                      <p className="text-sm text-primary-600 mt-1">
                        {formData.email}로 발송된 6자리 인증 코드를 입력해주세요.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 추가 정보 */}
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">추가 정보</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="memberCount">교인 수 (교적부 등록 예정)</Label>
                    <Input
                      id="memberCount"
                      type="number"
                      value={formData.memberCount}
                      onChange={(e) => handleInputChange('memberCount', e.target.value)}
                      placeholder="예: 100"
                    />
                  </div>

                  <div>
                    <Label htmlFor="homepageUrl">교회 홈페이지</Label>
                    <Input
                      id="homepageUrl"
                      type="url"
                      value={formData.homepageUrl}
                      onChange={(e) => handleInputChange('homepageUrl', e.target.value)}
                      placeholder="https://church.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="youtubeChannel">유튜브 채널</Label>
                    <Input
                      id="youtubeChannel"
                      type="url"
                      value={formData.youtubeChannel}
                      onChange={(e) => handleInputChange('youtubeChannel', e.target.value)}
                      placeholder="https://youtube.com/@channel"
                    />
                  </div>
                </div>
              </div>

              {/* 첨부파일 */}
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold">첨부파일</h3>

                <div>
                  <input
                    id="attachments"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div
                    onClick={() => document.getElementById('attachments')?.click()}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-primary bg-primary/10 scale-105'
                        : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                    }`}
                  >
                    <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${
                      isDragging ? 'text-primary' : 'text-gray-400'
                    }`} />
                    <p className={`text-base font-medium mb-2 ${
                      isDragging ? 'text-primary' : 'text-gray-700'
                    }`}>
                      {isDragging ? '파일을 여기에 놓으세요' : '파일을 드래그하여 업로드하거나 클릭하세요'}
                    </p>
                    <p className="text-sm text-gray-500">
                      교회 등록증, 교회 소개자료 등 (최대 5개, 각 5MB 이하)
                    </p>
                    {formData.attachments.length > 0 && (
                      <p className="text-sm text-primary font-medium mt-3">
                        {formData.attachments.length}개 파일 선택됨
                      </p>
                    )}
                  </div>

                  {formData.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">선택된 파일:</p>
                      <div className="space-y-1">
                        {formData.attachments.map((file, index) => (
                          <div key={index} className="text-sm text-gray-600 flex items-center bg-white p-2 rounded border group hover:border-red-300">
                            <Upload className="w-4 h-4 mr-2 text-gray-400" />
                            <span className="flex-1">{file.name}</span>
                            <span className="text-gray-400 mr-2">({(file.size / 1024).toFixed(1)}KB)</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFile(index)}
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 약관 동의 */}
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
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
                        <Link to="/terms" target="_blank" className="text-primary-600 hover:underline">
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
                        <Link to="/privacy" target="_blank" className="text-primary-600 hover:underline">
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
