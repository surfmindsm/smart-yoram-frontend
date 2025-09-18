import { supabase } from '../lib/supabase';

export const supabaseAuthService = {
  // 기존 users 테이블을 사용한 로그인
  signIn: async (email: string, password: string) => {
    try {
      // 1. users 테이블에서 사용자 찾기
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !users) {
        throw new Error('사용자를 찾을 수 없거나 계정이 비활성화되었습니다.');
      }

      // 2. 비밀번호 검증은 현재는 skip (실제로는 bcrypt 등으로 해시 비교해야 함)
      // TODO: 실제 환경에서는 bcrypt.compare(password, users.hashed_password) 사용

      // 3. 세션 정보 생성 (localStorage에 저장용)
      const sessionData = {
        user: {
          id: users.id,
          email: users.email,
          username: users.username,
          full_name: users.full_name,
          role: users.role,
          church_id: users.church_id,
          is_superuser: users.is_superuser
        },
        access_token: `temp_token_${users.id}_${Date.now()}`, // 임시 토큰
        expires_at: Date.now() + (24 * 60 * 60 * 1000) // 24시간
      };

      // 4. 로컬스토리지에 저장
      localStorage.setItem('supabase_session', JSON.stringify(sessionData));

      return {
        user: sessionData.user,
        session: sessionData,
        profile: sessionData.user
      };

    } catch (error: any) {
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