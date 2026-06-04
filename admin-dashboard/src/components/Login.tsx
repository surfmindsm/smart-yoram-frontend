import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { supabaseApiService } from '../services/supabaseApiService';
import { Button } from "./ui";
import { Input } from "./ui";
import { Label } from "./ui";
import { Alert, AlertDescription } from "./ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { UserPlus, ArrowLeft, AlertTriangle, Users, DollarSign, Calendar, BarChart3 } from 'lucide-react';
import { Spinner } from './ui/spinner';

// Church Round wordmark (Newsreader italic "church" + bold "round")
const Wordmark: React.FC<{ dark?: boolean; size?: number }> = ({ dark = false, size = 24 }) => (
  <span style={{ fontSize: `${size}px`, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
    <span
      className="text-primary"
      style={{ fontFamily: "Newsreader, Georgia, serif", fontStyle: 'italic', fontWeight: 500 }}
    >
      church
    </span>
    <span style={{ fontWeight: 800, color: dark ? '#fff' : '#0E1729', marginLeft: 4 }}>
      round
    </span>
  </span>
);

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
    <div className="flex min-h-screen w-full bg-background">
      {/* === Left: Dark brand panel === */}
      <div
        className="relative hidden flex-1 flex-col overflow-hidden px-[52px] py-12 text-white lg:flex"
        style={{ background: 'linear-gradient(150deg, #0E1729, #1B2740)' }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute right-10 top-[120px] text-[240px] leading-none text-primary/10"
          style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic' }}
        >
          ”
        </span>

        <Wordmark dark />

        <div className="mt-auto text-[38px] font-extrabold leading-[1.25] tracking-[-0.025em]">
          교회의 모든 살림을<br />한 곳에서, 단정하게.
        </div>
        <p className="mt-[18px] max-w-[420px] text-[15px] leading-[1.65] text-[#9DB0CC]">
          Church Round 관리자 페이지에서 교회 운영에 필요한 모든 기능을 한 곳에서 다루세요.
        </p>

        <div className="my-8 flex flex-col gap-[13px]">
          {[
            { Icon: Users, text: '교인·심방·중보기도 통합 관리' },
            { Icon: DollarSign, text: '헌금 관리와 기부금 영수증' },
            { Icon: Calendar, text: '예배 시간표 · 주보 · 푸시 알림' },
            { Icon: BarChart3, text: '출석·재정 통계로 보는 우리 교회' },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-[11px] text-[14px] text-[#C3CDDE]">
              <span
                className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[8px] text-primary"
                style={{ background: 'rgba(28, 124, 255, 0.16)' }}
              >
                <Icon className="h-4 w-4" />
              </span>
              {text}
            </div>
          ))}
        </div>

        <div className="text-[12px] text-[#54627E]">© 2026 Church Round · 관리자</div>
      </div>

      {/* === Right: Form === */}
      <div className="flex w-full flex-shrink-0 items-center justify-center bg-card px-10 py-10 lg:w-[480px]">
        <div className="w-full max-w-[340px]">
          <Wordmark size={22} />
          {/* welcome */}
          {step === 'login' ? (
            <div className="mt-[26px]">
              <div className="text-[23px] font-bold leading-tight tracking-[-0.02em] text-foreground">
                다시 오신 것을 환영합니다
              </div>
              <div className="mt-[5px] text-[13.5px] text-muted-foreground">
                관리자 계정으로 로그인하세요.
              </div>
            </div>
          ) : (
            <div className="mt-[26px]">
              <div className="text-[23px] font-bold leading-tight tracking-[-0.02em] text-foreground">
                이메일 인증
              </div>
              <div className="mt-[5px] text-[13.5px] text-muted-foreground">
                <b className="text-foreground">{email}</b>로 보낸 6자리 인증 코드를 입력하세요.
              </div>
            </div>
          )}

          {/* 모바일 환경 경고 */}
          {showMobileWarning && (
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>모바일 환경 감지</strong>
                <br />
                관리자 화면은 데스크톱 환경에 최적화되어 있습니다. 모바일 기기에서는 레이아웃이 제대로 표시되지 않을 수 있습니다. PC에서 접속하시는 것을 권장합니다.
              </AlertDescription>
            </Alert>
          )}

          {step === 'login' ? (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">비밀번호</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => navigate('/forgot-password')}
                    className="text-xs text-muted-foreground hover:text-foreground px-0"
                  >
                    비밀번호 찾기
                  </Button>
                </div>
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
            <div className="mt-4 space-y-3">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleEmailVerification} className="space-y-3">
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
                        <p className="max-w-xs">일반 커뮤니티 회원 계정을 신청합니다.<br />교회 정보 없이 커뮤니티 기능만 이용할 수 있습니다.<br /><strong className="text-yellow-400">📱 모바일 앱 전용</strong> - 웹 관리자 페이지 로그인 불가</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>

                <div className="pt-2 space-y-1">
                  <p className="text-xs text-muted-foreground">
                    교회 관리자는 '교회 가입 신청'을 이용해주세요
                  </p>
                  <p className="text-xs text-yellow-600 font-medium">
                    💡 일반 회원(member)은 모바일 앱 전용입니다 (웹 관리자 페이지 로그인 불가)
                  </p>
                </div>
              </div>

              {/* 서비스 이용약관 및 개인정보처리방침 링크 */}
              <div className="border-t border-border pt-4 text-center">
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
        </div>
      </div>
    </div>
  );
};

export default Login;