import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { supabaseApiService } from '../services/supabaseApiService';
import { Button } from "./ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui";
import { Input } from "./ui";
import { Label } from "./ui";
import { Alert, AlertDescription } from "./ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { UserPlus, ArrowLeft, Mail, AlertTriangle } from 'lucide-react';
import { Spinner } from './ui/spinner';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [step, setStep] = useState<'login' | 'email-verification'>('login');
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const navigate = useNavigate();

  // 모바일 환경 체크
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024; // 태블릿 포함 1024px 미만을 모바일로 간주
      setShowMobileWarning(isMobile);
    };

    // 초기 체크
    checkMobile();

    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', checkMobile);

    // 클린업
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1단계: 이메일과 비밀번호로 사용자 인증
      const userData = await supabaseAuthService.signIn(email, password);

      // 인증 성공 시 사용자 데이터 저장하고 이메일 인증 단계로 이동
      setPendingUserData(userData);

      // 이메일 인증 코드 발송
      await supabaseApiService.emailVerification.sendCode(email);
      setEmailVerificationSent(true);
      setStep('email-verification');

    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 이메일 인증 코드 확인
      await supabaseApiService.emailVerification.verifyCode(email, emailVerificationCode);

      // 인증 성공 시 세션 복원 및 대시보드로 이동
      if (pendingUserData) {
        // 임시 비밀번호 패턴 체크 (8자리 영숫자)
        const isTempPassword = /^[A-Za-z0-9]{8}$/.test(password);
        if (isTempPassword) {
          localStorage.setItem('temporary_password_login', 'true');
        }

        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || '이메일 인증에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerification = async () => {
    setError('');
    setLoading(true);

    try {
      await supabaseApiService.emailVerification.sendCode(email);
      setEmailVerificationSent(true);
    } catch (err: any) {
      setError(err.message || '인증 코드 발송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep('login');
    setEmailVerificationCode('');
    setEmailVerificationSent(false);
    setPendingUserData(null);
    setError('');
  };

  const handleCommunitySignupClick = () => {
    navigate('/community-signup');
  };

  const handleChurchSignupClick = () => {
    navigate('/church-signup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md border-muted">
        <CardHeader className="space-y-1">
          <div className="flex justify-center">
            <img
              src="/logo_type3_white.png"
              alt="Church Round"
              className="h-16"
            />
          </div>
          {step === 'email-verification' && (
            <CardDescription className="text-center">
              이메일로 전송된 인증 코드를 입력하세요
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {/* 모바일 환경 경고 */}
          {showMobileWarning && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>모바일 환경 감지</strong>
                <br />
                관리자 화면은 데스크톱 환경에 최적화되어 있습니다. 모바일 기기에서는 레이아웃이 제대로 표시되지 않을 수 있습니다. PC에서 접속하시는 것을 권장합니다.
              </AlertDescription>
            </Alert>
          )}
          {step === 'login' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" text="로그인 중..." /> : '로그인'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  <strong>{email}</strong>로 인증 코드를 발송했습니다.
                </p>
                <p className="text-xs text-muted-foreground">
                  이메일을 확인하고 6자리 인증 코드를 입력하세요.
                </p>
              </div>

              <form onSubmit={handleEmailVerification} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">인증 코드</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    required
                    placeholder="6자리 인증 코드"
                    value={emailVerificationCode}
                    onChange={(e) => setEmailVerificationCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-widest"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleBackToLogin}
                    disabled={loading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    뒤로
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={loading || emailVerificationCode.length !== 6}
                  >
                    {loading ? <Spinner size="sm" text="인증 중..." /> : '인증 완료'}
                  </Button>
                </div>
              </form>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={sendEmailVerification}
                  disabled={loading}
                  className="text-xs"
                >
                  인증 코드 재발송
                </Button>
              </div>
            </div>
          )}

          {/* 회원 신청 섹션 - 로그인 단계에만 표시 */}
          {step === 'login' && (
            <>
              {/* 구분선 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">또는</span>
                </div>
              </div>

              {/* 회원 신청 섹션 */}
              <div className="text-center space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    아직 계정이 없으신가요?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    신청 후 승인을 받아 이용하실 수 있습니다
                  </p>
                </div>

                {/* 가입 신청 버튼 - 2열 그리드 */}
                <TooltipProvider>
                  <div className="grid grid-cols-2 gap-4">
                    {/* 교회 가입 신청 버튼 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-24 flex flex-col items-center justify-center space-y-2"
                          onClick={handleChurchSignupClick}
                        >
                          <UserPlus className="w-6 h-6" />
                          <span className="text-sm font-semibold">교회 가입 신청</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-900 text-white border-gray-800">
                        <p className="max-w-xs">교회 관리자 계정을 신청합니다.<br />교회 정보 관리 및 교인 관리가 가능합니다.</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* 커뮤니티 가입 신청 버튼 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="h-24 flex flex-col items-center justify-center space-y-2"
                          onClick={handleCommunitySignupClick}
                        >
                          <UserPlus className="w-6 h-6" />
                          <span className="text-sm font-semibold">커뮤니티 가입 신청</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-900 text-white border-gray-800">
                        <p className="max-w-xs">일반 커뮤니티 회원 계정을 신청합니다.<br />교회 정보 없이 커뮤니티 기능만 이용할 수 있습니다.<br /><strong className="text-yellow-400">📱 모바일 앱 전용</strong> - 웹 로그인 불가</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>

                <div className="pt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    교회 관리자는 '교회 가입 신청'을 이용해주세요
                  </p>
                  <p className="text-xs text-yellow-600 font-medium">
                    💡 커뮤니티 회원은 모바일 앱 전용입니다 (웹 로그인 불가)
                  </p>
                </div>
              </div>

              {/* 서비스 이용약관 및 개인정보처리방침 링크 */}
              <div className="text-center pt-4 border-t border-muted">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => navigate('/terms')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    서비스 이용약관
                  </Button>
                  <span className="text-xs text-muted-foreground">|</span>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => navigate('/privacy')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    개인정보처리방침
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;