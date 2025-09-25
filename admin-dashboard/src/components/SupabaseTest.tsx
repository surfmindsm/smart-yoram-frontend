import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from "@/components/ui3";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui3";

const SupabaseTest: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const testConnection = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🔍 Supabase 연결 테스트 시작...');

      // 1. 단순 연결 테스트
      const { data, error } = await supabase
        .from('users')
        .select('id, email, username, is_active')
        .limit(5);

      console.log('📊 쿼리 결과:', { data, error });

      if (error) {
        throw error;
      }

      setUsers(data || []);
      console.log('✅ 연결 성공! 사용자 수:', data?.length);
    } catch (err: any) {
      console.error('❌ 연결 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    if (users.length === 0) {
      setError('먼저 사용자 목록을 로드하세요');
      return;
    }

    const testUser = users[0];
    console.log('🔑 테스트 로그인 시도:', testUser.email);

    try {
      const { data: loginResult, error: loginError } = await supabase
        .from('users')
        .select('*')
        .eq('email', testUser.email)
        .eq('is_active', true)
        .single();

      console.log('🎯 로그인 테스트 결과:', { loginResult, loginError });

      if (loginError) {
        throw loginError;
      }

      console.log('✅ 로그인 테스트 성공!');
    } catch (err: any) {
      console.error('❌ 로그인 테스트 실패:', err);
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Supabase 연결 테스트</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testConnection} disabled={loading}>
            {loading ? '테스트 중...' : '연결 테스트'}
          </Button>
          <Button onClick={testLogin} disabled={loading || users.length === 0}>
            로그인 테스트
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            에러: {error}
          </div>
        )}

        {users.length > 0 && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <p className="font-bold">연결 성공! 사용자 {users.length}명 발견:</p>
            <ul className="mt-2 space-y-1">
              {users.map((user) => (
                <li key={user.id} className="text-sm">
                  {user.email} ({user.username}) - {user.is_active ? '활성' : '비활성'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-gray-500">
          브라우저 개발자 도구의 콘솔에서 상세한 로그를 확인하세요.
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseTest;