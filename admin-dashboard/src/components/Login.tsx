import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { cn } from '../lib/utils';
import { UserPlus } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupClick = () => {
    navigate('/community-signup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md border-muted">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">스마트 요람 관리자</CardTitle>
          <CardDescription className="text-center">
            관리자 계정으로 로그인하세요
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
              <Label htmlFor="username">사용자명</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                placeholder="사용자명"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

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
                커뮤니티 이용을 원하시나요?
              </p>
              <p className="text-xs text-muted-foreground">
                업체 관계자 및 외부 이용자는 신청 후 승인을 받아 이용하실 수 있습니다
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSignupClick}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              커뮤니티 회원 신청
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;