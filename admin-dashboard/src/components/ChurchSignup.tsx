import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Button,
  Card,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Alert,
  AlertDescription,
} from "./ui";
import { Spinner } from "./ui/spinner";
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Mail,
  FileText,
} from 'lucide-react';
import { churchApplicationService, ChurchApplicationRequest } from '../services/churchApplicationService';
import { supabaseApiService } from '../services/supabaseApiService';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

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

const Wordmark: React.FC = () => (
  <span style={{ fontSize: 20, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
    <span
      className="text-primary"
      style={{ fontFamily: 'Newsreader, Georgia, serif', fontStyle: 'italic', fontWeight: 500 }}
    >
      church
    </span>
    <span className="text-[#0E1729]" style={{ fontWeight: 800, marginLeft: 4 }}>
      round
    </span>
  </span>
);

const SectionHeader: React.FC<{ title: string; description?: string }> = ({ title, description }) => (
  <div className="border-b border-[#EEF1F6] px-5 py-3.5">
    <div className="text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</div>
    {description && <div className="mt-0.5 text-[12px] text-muted-foreground">{description}</div>}
  </div>
);

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
    agreeMarketing: false,
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
    '무교단',
  ];

  const handleInputChange = (field: keyof SignupFormData, value: string | boolean | File[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      email: '계정 사용자 이메일',
    };
    return labels[field] || field;
  };

  const validateForm = (): boolean => {
    if (!emailVerified) {
      setError('이메일 인증을 완료해주세요.');
      return false;
    }
    const requiredFields = [
      'churchName', 'pastorName', 'denomination', 'establishedYear', 'address', 'phone',
      'adminName', 'adminPhone', 'email',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);

    try {
      const emailExists = await supabaseApiService.emailVerification.checkEmailExists(formData.email);
      if (emailExists) {
        setError('이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.');
        setLoading(false);
        return;
      }

      const uploadedAttachments: Array<{ filename: string; path: string; size: number; url: string }> = [];

      if (formData.attachments.length > 0) {
        for (let i = 0; i < formData.attachments.length; i++) {
          const file = formData.attachments[i];
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const fileExtension = file.name.split('.').pop();
          const fileName = `application_${timestamp}_${randomString}.${fileExtension}`;
          const storagePath = `applications/${fileName}`;
          try {
            const { error: uploadError } = await supabase.storage
              .from('church-application-files')
              .upload(storagePath, file, { cacheControl: '3600', upsert: false });
            if (uploadError) throw new Error(`파일 업로드 실패: ${file.name}`);
            const { data: publicUrlData } = supabase.storage
              .from('church-application-files')
              .getPublicUrl(storagePath);
            uploadedAttachments.push({
              filename: file.name,
              path: storagePath,
              size: file.size,
              url: publicUrlData.publicUrl,
            });
          } catch (uploadError: any) {
            setError(`파일 업로드 실패: ${file.name}. ${uploadError.message}`);
            setLoading(false);
            return;
          }
        }
      }

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
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments as any : undefined,
      };

      const result = await churchApplicationService.submitApplication(requestData);

      try {
        await supabaseApiService.notifyApplication.send(
          'church',
          formData.email,
          formData.adminName,
          formData.churchName,
          result.application_id,
        );
      } catch (notifyError) {
        console.error('알림 이메일 발송 실패 (신청은 완료됨):', notifyError);
      }

      setSuccess(true);
    } catch (err: any) {
      if (err.response?.status === 422) {
        setError(`입력 데이터 오류: ${err.response?.data?.detail || err.message}`);
      } else {
        setError(err.message || '신청서 제출 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 성공 화면
  if (success) {
    return (
      <div className="min-h-screen bg-[#F8FAFD]">
        <header className="border-b border-[#EEF1F6] bg-white">
          <div className="mx-auto flex h-16 max-w-[920px] items-center px-6">
            <Wordmark />
          </div>
        </header>
        <div className="mx-auto flex max-w-[480px] flex-col items-center px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E7F6EC] text-[#16A34A]">
            <CheckCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-[24px] font-bold tracking-[-0.02em] text-[#0E1729]">
            신청이 완료되었습니다
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-[#64748B]">
            교회 가입 신청이 정상적으로 제출되었습니다.<br />
            관리자 검토 후 승인 결과를 이메일로 안내드리겠습니다.
          </p>
          <div className="mt-7 flex w-full gap-2">
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
              홈으로
            </Button>
            <Button onClick={() => navigate('/login')} className="flex-1">
              로그인
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFD]">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-10 border-b border-[#EEF1F6] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[920px] items-center px-6">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#475569] transition-colors hover:text-[#0E1729]"
          >
            <ArrowLeft className="h-4 w-4" />
            로그인으로 돌아가기
          </button>
          <div className="ml-auto">
            <Wordmark />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[760px] px-6 py-10">
        {/* 페이지 타이틀 */}
        <div className="mb-8">
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-[#0E1729] md:text-[32px]">
            교회 관리자 가입 신청
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#64748B]">
            Church Round로 교회 운영을 한 곳에서 관리하세요.<br />
            신청 후 검토를 거쳐 승인이 완료되면 이메일로 안내드립니다.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 기본 정보 */}
          <Card className="overflow-hidden">
            <SectionHeader title="기본 정보" description="교회의 기본 정보를 입력해주세요." />
            <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="churchName" className="text-[12.5px] font-semibold">
                  교회명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="churchName"
                  value={formData.churchName}
                  onChange={(e) => handleInputChange('churchName', e.target.value)}
                  placeholder="○○교회"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="churchRegistrationNumber" className="text-[12.5px] font-semibold">
                  교회 고유번호
                </Label>
                <Input
                  id="churchRegistrationNumber"
                  value={formData.churchRegistrationNumber}
                  onChange={(e) => handleInputChange('churchRegistrationNumber', e.target.value)}
                  placeholder="000-00-00000 (선택)"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pastorName" className="text-[12.5px] font-semibold">
                  담임 목사명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="pastorName"
                  value={formData.pastorName}
                  onChange={(e) => handleInputChange('pastorName', e.target.value)}
                  placeholder="홍길동 목사"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="denomination" className="text-[12.5px] font-semibold">
                  교단/교파 <span className="text-destructive">*</span>
                </Label>
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

              <div className="space-y-1.5">
                <Label htmlFor="establishedYear" className="text-[12.5px] font-semibold">
                  설립연도 <span className="text-destructive">*</span>
                </Label>
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

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[12.5px] font-semibold">
                  교회 대표 번호 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="02-1234-5678"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="address" className="text-[12.5px] font-semibold">
                  교회 주소 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="서울시 강남구 ..."
                />
              </div>
            </div>
          </Card>

          {/* 계정 정보 */}
          <Card className="overflow-hidden">
            <SectionHeader
              title="계정 정보 (최고 관리자)"
              description="승인 후 로그인에 사용될 관리자 계정 정보입니다."
            />
            <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="adminName" className="text-[12.5px] font-semibold">
                  계정 사용자명 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="adminName"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  placeholder="김관리 집사"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adminPhone" className="text-[12.5px] font-semibold">
                  계정 사용자 연락처 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="adminPhone"
                  value={formData.adminPhone}
                  onChange={(e) => handleInputChange('adminPhone', e.target.value)}
                  placeholder="010-0000-0000"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="email" className="text-[12.5px] font-semibold">
                  계정 사용자 이메일 (로그인 ID) <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="example@example.com"
                    disabled={emailVerified}
                    className={cn(emailVerified && 'border-[#16A34A]/40 bg-[#F0FAF3] text-[#0E1729]')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendEmailVerification}
                    disabled={emailVerificationLoading || !formData.email || emailVerified}
                    className="min-w-[100px]"
                  >
                    {emailVerificationLoading ? '발송중...' : emailVerified ? '인증완료' : '인증코드 발송'}
                  </Button>
                </div>

                {/* 인증 상태 메시지 */}
                {emailError ? (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#DC2626]">
                    <X className="h-3.5 w-3.5" />
                    {emailError}
                  </div>
                ) : emailVerified ? (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[12px] font-semibold text-[#16A34A]">
                    <CheckCircle className="h-3.5 w-3.5" />
                    이메일 인증이 완료되었습니다.
                  </div>
                ) : (
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
                    승인 시 이 이메일로 로그인 정보를 발송합니다. 인증 코드가 오지 않으면{' '}
                    <a href="tel:010-6617-1875" className="font-semibold text-primary hover:underline">010-6617-1875</a>
                    {' '}또는{' '}
                    <a href="mailto:contact@churchround.com" className="font-semibold text-primary hover:underline">contact@churchround.com</a>
                    {' '}으로 연락 주세요.
                  </p>
                )}
              </div>

              {emailVerificationSent && !emailVerified && (
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="emailVerificationCode" className="text-[12.5px] font-semibold">
                    이메일 인증 코드 <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="emailVerificationCode"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={formData.emailVerificationCode}
                      onChange={(e) => handleInputChange('emailVerificationCode', e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-[18px] font-bold tracking-[0.4em] tabular-nums placeholder:tracking-[0.4em] placeholder:text-[#CBD5E1]"
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
                  <p className="text-[11.5px] text-muted-foreground">
                    <Mail className="mr-1 inline h-3 w-3" />
                    <b>{formData.email}</b>로 발송된 6자리 코드를 입력해 주세요.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* 추가 정보 */}
          <Card className="overflow-hidden">
            <SectionHeader title="추가 정보" description="선택 항목입니다. 입력하지 않아도 신청할 수 있습니다." />
            <div className="grid grid-cols-1 gap-4 px-5 py-5 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="memberCount" className="text-[12.5px] font-semibold">교인 수</Label>
                <Input
                  id="memberCount"
                  type="number"
                  value={formData.memberCount}
                  onChange={(e) => handleInputChange('memberCount', e.target.value)}
                  placeholder="예: 100"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="homepageUrl" className="text-[12.5px] font-semibold">교회 홈페이지</Label>
                <Input
                  id="homepageUrl"
                  type="url"
                  value={formData.homepageUrl}
                  onChange={(e) => handleInputChange('homepageUrl', e.target.value)}
                  placeholder="https://church.com"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="youtubeChannel" className="text-[12.5px] font-semibold">유튜브 채널</Label>
                <Input
                  id="youtubeChannel"
                  type="url"
                  value={formData.youtubeChannel}
                  onChange={(e) => handleInputChange('youtubeChannel', e.target.value)}
                  placeholder="https://youtube.com/@channel"
                />
              </div>
            </div>
          </Card>

          {/* 첨부파일 */}
          <Card className="overflow-hidden">
            <SectionHeader title="첨부 파일" description="교회 등록증, 소개 자료 등 (최대 5개, 각 5MB 이하)" />
            <div className="px-5 py-5">
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
                className={cn(
                  'cursor-pointer rounded-[12px] border-2 border-dashed px-6 py-10 text-center transition-all',
                  isDragging
                    ? 'border-primary bg-[#EAF1FE]'
                    : 'border-[#E3E8F0] bg-[#FAFBFD] hover:border-primary/40 hover:bg-[#F0F6FF]'
                )}
              >
                <Upload className={cn('mx-auto h-7 w-7', isDragging ? 'text-primary' : 'text-[#94A3B8]')} />
                <p className={cn('mt-3 text-[13.5px] font-semibold', isDragging ? 'text-primary' : 'text-[#475569]')}>
                  {isDragging ? '파일을 여기에 놓아주세요' : '파일을 드래그하거나 클릭하여 업로드'}
                </p>
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  PDF · JPG · PNG · DOC 지원
                </p>
              </div>

              {formData.attachments.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  {formData.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 rounded-[8px] border border-[#EEF1F6] bg-white px-3 py-2"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0 text-[#94A3B8]" />
                      <span className="flex-1 truncate text-[13px] font-medium text-foreground">{file.name}</span>
                      <span className="flex-shrink-0 text-[11.5px] tabular-nums text-[#94A3B8]">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="h-7 w-7 flex-shrink-0 p-0 text-muted-foreground hover:bg-[#FCEBEB] hover:text-[#DC2626]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* 약관 동의 */}
          <Card className="overflow-hidden">
            <SectionHeader title="약관 동의" />
            <div className="space-y-3 px-5 py-5">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="agreeTerms"
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) => handleInputChange('agreeTerms', !!checked)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor="agreeTerms" className="cursor-pointer text-[13px] font-medium text-foreground">
                    서비스 이용약관 동의 <span className="text-destructive">(필수)</span>
                  </Label>
                  <Link to="/terms" target="_blank" className="ml-2 text-[12px] text-primary hover:underline">
                    내용 보기
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="agreePrivacy"
                  checked={formData.agreePrivacy}
                  onCheckedChange={(checked) => handleInputChange('agreePrivacy', !!checked)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor="agreePrivacy" className="cursor-pointer text-[13px] font-medium text-foreground">
                    개인정보처리방침 동의 <span className="text-destructive">(필수)</span>
                  </Label>
                  <Link to="/privacy" target="_blank" className="ml-2 text-[12px] text-primary hover:underline">
                    내용 보기
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="agreeMarketing"
                  checked={formData.agreeMarketing}
                  onCheckedChange={(checked) => handleInputChange('agreeMarketing', !!checked)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <Label htmlFor="agreeMarketing" className="cursor-pointer text-[13px] font-medium text-foreground">
                    마케팅 정보 수신 동의 <span className="text-muted-foreground">(선택)</span>
                  </Label>
                  <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                    새로운 서비스나 이벤트 소식을 이메일로 받아보실 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 제출 버튼 */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="min-w-[160px]"
            >
              {loading ? (
                <>
                  <Spinner size="sm" variant="white" className="mr-2" />
                  제출 중...
                </>
              ) : (
                '가입 신청하기'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChurchSignup;
