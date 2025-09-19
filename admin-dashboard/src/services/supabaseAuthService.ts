import { supabase } from '../lib/supabase';

export const supabaseAuthService = {
  // 기존 users 테이블을 사용한 로그인
  signIn: async (email: string, password: string) => {
    try {
      console.log('🔑 로그인 시도:', { email, password: '***' });

      // 1. Edge Function을 통해 사용자 찾기 (이메일로 쿼리)
      console.log('🔍 사용자 조회 중...');
      const token = 'temp_system_token'; // 시스템 로그인용 임시 토큰

      const { data: user, error } = await supabase.functions.invoke(`users?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'X-Custom-Auth': token,
          'Content-Type': 'application/json',
        },
      });

      if (error) {
        throw new Error(`사용자 조회 실패: ${error.message}`);
      }
      console.log('📊 쿼리 결과:', { user });

      if (!user || (Array.isArray(user) && user.length === 0)) {
        console.error('❌ 사용자 조회 실패: 사용자 없음');
        throw new Error('사용자를 찾을 수 없거나 계정이 비활성화되었습니다.');
      }

      // 2. 비밀번호 검증은 현재는 skip (실제로는 bcrypt 등으로 해시 비교해야 함)
      // TODO: 실제 환경에서는 bcrypt.compare(password, users.hashed_password) 사용

      // 3. 세션 정보 생성 (localStorage에 저장용)
      console.log('✅ 사용자 찾음, 세션 생성 중...');
      const sessionData = {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          church_id: user.church_id,
          is_superuser: user.is_superuser
        },
        access_token: `temp_token_${user.id}_${Date.now()}`, // 임시 토큰
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24시간
      };

      // 4. 로컬스토리지에 저장
      console.log('💾 세션 저장 중...', sessionData.user);
      localStorage.setItem('supabase_session', JSON.stringify(sessionData));

      // 기존 PrivateRoute 호환성을 위해 access_token도 별도 저장
      localStorage.setItem('access_token', sessionData.access_token);
      console.log('🔑 호환성을 위한 access_token 저장 완료');

      console.log('🎉 로그인 성공!');
      return {
        user: sessionData.user,
        session: sessionData,
        profile: sessionData.user
      };

    } catch (error: any) {
      console.error('💥 로그인 에러:', error);
      throw new Error(error.message || '로그인에 실패했습니다.');
    }
  },

  // 회원가입
  signUp: async (email: string, password: string, userData?: {
    full_name?: string;
    church_id?: number;
    role?: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    // 프로필 생성
    if (data.user && userData) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: userData.full_name,
          church_id: userData.church_id,
          role: userData.role || 'member'
        });

      if (profileError) {
        console.error('프로필 생성 실패:', profileError);
      }
    }

    return data;
  },

  // 로그아웃
  signOut: async () => {
    try {
      localStorage.removeItem('supabase_session');
      localStorage.removeItem('access_token'); // 호환성을 위한 토큰도 제거
    } catch (error: any) {
      throw new Error('로그아웃에 실패했습니다.');
    }
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser: async () => {
    try {
      const sessionStr = localStorage.getItem('supabase_session');
      if (!sessionStr) {
        return null;
      }

      const session = JSON.parse(sessionStr);

      // 세션 만료 확인
      if (Date.now() > session.expires_at) {
        localStorage.removeItem('supabase_session');
        localStorage.removeItem('access_token');
        return null;
      }

      return {
        user: session.user,
        profile: session.user
      };
    } catch {
      return null;
    }
  },

  // 현재 세션 가져오기
  getSession: async () => {
    try {
      const sessionStr = localStorage.getItem('supabase_session');
      if (!sessionStr) {
        return null;
      }

      const session = JSON.parse(sessionStr);

      // 세션 만료 확인
      if (Date.now() > session.expires_at) {
        localStorage.removeItem('supabase_session');
        localStorage.removeItem('access_token');
        return null;
      }

      return session;
    } catch {
      return null;
    }
  },

  // 인증 상태 확인
  isAuthenticated: async () => {
    try {
      const session = await supabaseAuthService.getSession();
      return !!session;
    } catch {
      return false;
    }
  },

  // 인증 상태 변화 리스너
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  // 액세스 토큰 가져오기 (기존 API와 호환성을 위해)
  getToken: async () => {
    const session = await supabaseAuthService.getSession();
    return session?.access_token || null;
  }
};

// 기존 authService와 호환성을 위한 별칭
export const authService = {
  login: async (username: string, password: string) => {
    // username을 email로 처리
    return await supabaseAuthService.signIn(username, password);
  },

  logout: async () => {
    return await supabaseAuthService.signOut();
  },

  getCurrentUser: async () => {
    const result = await supabaseAuthService.getCurrentUser();
    return result?.user || null;
  },

  getToken: async () => {
    return await supabaseAuthService.getToken();
  },

  isAuthenticated: async () => {
    return await supabaseAuthService.isAuthenticated();
  }
};