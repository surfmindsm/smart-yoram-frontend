import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "./ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui";
import { Input } from "./ui";
import { Label } from "./ui";
import { Alert, AlertDescription } from "./ui";
import { ArrowLeft, Mail, Phone, CheckCircle2 } from 'lucide-react';
import { Spinner } from './ui/spinner';
import { supabaseApiService } from '../services/supabaseApiService';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 전화번호 형식 정리 (하이픈 제거)
      const cleanPhone = phone.replace(/[^0-9]/g, '');

      // Edge Function 호출
      const response = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/reset-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            email,
            phone: cleanPhone
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '비밀번호 재설정에 실패했습니다.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '비밀번호 재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md border-muted">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">임시 비밀번호 발송 완료</CardTitle>
            <CardDescription className="text-center">
              이메일로 임시 비밀번호가 발송되었습니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>{email}</strong>로 임시 비밀번호를 발송했습니다.
                <br />
                <br />
                이메일을 확인하신 후 임시 비밀번호로 로그인해주세요.
                <br />
                로그인 후 반드시 비밀번호를 변경해주시기 바랍니다.
              </AlertDescription>
            </Alert>

            <Button
              type="button"
              className="w-full"
              onClick={handleBackToLogin}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              로그인 페이지로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <CardTitle className="text-2xl text-center">비밀번호 찾기</CardTitle>
          <CardDescription className="text-center">
            가입 시 등록한 이메일과 전화번호를 입력하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  required
                  placeholder="010-1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                하이픈(-)은 자동으로 제거됩니다
              </p>
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
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" text="처리 중..." /> : '임시 비밀번호 발송'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              가입 정보가 기억나지 않으신가요?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              관리자에게 문의해주세요
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
