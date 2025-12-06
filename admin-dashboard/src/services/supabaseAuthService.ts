import { supabase } from '../lib/supabase';

// 위치 정보 한국어 매핑 테이블
const countryMap: { [key: string]: string } = {
  'South Korea': '대한민국',
  'Korea': '대한민국',
  'Republic of Korea': '대한민국',
  'United States': '미국',
  'United States of America': '미국',
  'China': '중국',
  'Japan': '일본',
  'United Kingdom': '영국',
  'Germany': '독일',
  'France': '프랑스',
  'Canada': '캐나다',
  'Australia': '호주',
  'Russia': '러시아',
  'India': '인도',
  'Brazil': '브라질',
  'Italy': '이탈리아',
  'Spain': '스페인',
  'Mexico': '멕시코',
  'Indonesia': '인도네시아',
  'Turkey': '터키',
  'Saudi Arabia': '사우디아라비아',
  'Netherlands': '네덜란드',
  'Switzerland': '스위스',
  'Belgium': '벨기에',
  'Sweden': '스웨덴',
  'Poland': '폴란드',
  'Argentina': '아르헨티나',
  'Ireland': '아일랜드',
  'Israel': '이스라엘',
  'Austria': '오스트리아',
  'Norway': '노르웨이',
  'United Arab Emirates': '아랍에미리트',
  'Egypt': '이집트',
  'South Africa': '남아프리카공화국',
  'Chile': '칠레',
  'Finland': '핀란드',
  'Denmark': '덴마크',
  'Philippines': '필리핀',
  'Bangladesh': '방글라데시',
  'Vietnam': '베트남',
  'Malaysia': '말레이시아',
  'Singapore': '싱가포르',
  'Thailand': '태국',
  'Nigeria': '나이지리아',
  'Ukraine': '우크라이나',
  'Peru': '페루',
  'Czech Republic': '체코',
  'New Zealand': '뉴질랜드',
  'Romania': '루마니아',
  'Greece': '그리스',
  'Portugal': '포르투갈',
  'Hungary': '헝가리',
  'Belarus': '벨라루스',
  'Cuba': '쿠바',
  'Croatia': '크로아티아',
  'Bulgaria': '불가리아',
  'Slovakia': '슬로바키아',
  'Lithuania': '리투아니아',
  'Slovenia': '슬로베니아',
  'Latvia': '라트비아',
  'Estonia': '에스토니아',
  'Luxembourg': '룩셈부르크'
};

const cityMap: { [key: string]: string } = {
  'Seoul': '서울',
  'Busan': '부산',
  'Incheon': '인천',
  'Daegu': '대구',
  'Daejeon': '대전',
  'Gwangju': '광주',
  'Ulsan': '울산',
  'Suwon': '수원',
  'Goyang': '고양',
  'Yongin': '용인',
  'Seongnam': '성남',
  'Bucheon': '부천',
  'Ansan': '안산',
  'Cheongju': '청주',
  'Jeonju': '전주',
  'Anyang': '안양',
  'Cheonan': '천안',
  'Pohang': '포항',
  'Changwon': '창원',
  'Gimhae': '김해',
  'Jeju': '제주',
  'Beijing': '베이징',
  'Shanghai': '상하이',
  'Tokyo': '도쿄',
  'Osaka': '오사카',
  'New York': '뉴욕',
  'Los Angeles': '로스앤젤레스',
  'London': '런던',
  'Paris': '파리',
  'Berlin': '베를린',
  'Rome': '로마',
  'Madrid': '마드리드',
  'Amsterdam': '암스테르담',
  'Brussels': '브뤼셀',
  'Vienna': '비엔나',
  'Zurich': '취리히',
  'Stockholm': '스톡홀름',
  'Copenhagen': '코펜하겐',
  'Oslo': '오슬로',
  'Helsinki': '헬싱키',
  'Warsaw': '바르샤바',
  'Prague': '프라하',
  'Budapest': '부다페스트',
  'Dublin': '더블린',
  'Lisbon': '리스본',
  'Athens': '아테네',
  'Moscow': '모스크바',
  'Sydney': '시드니',
  'Melbourne': '멜버른',
  'Toronto': '토론토',
  'Vancouver': '밴쿠버',
  'Montreal': '몬트리올'
};

// 클라이언트 IP 주소 가져오기 헬퍼 함수
const getClientIP = async (): Promise<string> => {
  try {
    // 항상 실제 IP 조회 시도
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || '0.0.0.0';
  } catch (error) {
    console.error('IP 주소 조회 실패:', error);
    // 실패 시에만 개발 환경 기본값 사용
    return process.env.NODE_ENV === 'development' ? '개발환경' : '0.0.0.0';
  }
};

// 위치 정보 가져오기 헬퍼 함수 (테더링 감지 포함)
const getLocationInfo = async (): Promise<string> => {
  try {
    // 항상 실제 위치 조회 시도 (HTTPS 사용)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();

    console.log('🌍 위치 정보 조회 결과:', data);

    if (data.city && data.country_name) {
      const koreanCity = cityMap[data.city] || data.city;
      const koreanCountry = countryMap[data.country_name] || data.country_name;
      return `${koreanCity}, ${koreanCountry}`;
    }

    return '위치 정보 없음';
  } catch (error) {
    console.error('위치 정보 조회 실패:', error);

    // 백업으로 다른 서비스 시도
    try {
      const backupResponse = await fetch('https://api.ipgeolocation.io/ipgeo?apiKey=free');
      const backupData = await backupResponse.json();

      console.log('🔄 백업 위치 정보 조회 결과:', backupData);

      if (backupData.city && backupData.country_name) {
        const koreanCity = cityMap[backupData.city] || backupData.city;
        const koreanCountry = countryMap[backupData.country_name] || backupData.country_name;

        // 백업 서비스에서도 ISP 확인
        const isp = backupData.isp || backupData.organization || '';
        if (isp.toLowerCase().includes('mobile') || isp.toLowerCase().includes('cellular')) {
          return `📱 모바일 테더링 (${koreanCity}, ${koreanCountry})`;
        }

        return `${koreanCity}, ${koreanCountry}`;
      }
    } catch (backupError) {
      console.error('백업 위치 조회도 실패:', backupError);
    }

    return process.env.NODE_ENV === 'development' ? '🔧 개발환경' : '-';
  }
};

export const supabaseAuthService = {
  // 기존 users 테이블을 사용한 로그인
  signIn: async (email: string, password: string) => {
    try {
      console.log('🔑 로그인 시도:', { email, password: '***' });

      // 1. users 테이블에서 직접 사용자 찾기 (이메일로 쿼리)
      console.log('🔍 users 테이블에서 사용자 조회 중...');

      let { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.error('❌ Supabase users 테이블 조회 오류:', error);
        throw new Error(`사용자 조회 실패: ${error.message}`);
      }

      console.log('📊 쿼리 결과:', { users });

      if (!users || users.length === 0) {
        console.error('❌ 사용자 조회 실패: 사용자 없음 또는 비활성화');

        // users 테이블에 없으면 members 테이블에서 찾아서 생성 시도
        console.log('🔄 members 테이블에서 사용자 생성 시도...');
        try {
          const { supabaseApiService } = await import('./supabaseApiService');
          const createResult = await supabaseApiService.users.createFromMember(email);

          if (createResult.data) {
            console.log('✅ users 테이블에 사용자 생성 완료, 로그인 재시도...');

            // 다시 users 테이블에서 조회
            const { data: newUsers, error: retryError } = await supabase
              .from('users')
              .select('*')
              .eq('email', email)
              .eq('is_active', true)
              .limit(1);

            if (retryError || !newUsers || newUsers.length === 0) {
              throw new Error('사용자 생성 후 재조회 실패');
            }

            // 생성된 사용자로 계속 진행
            users = newUsers;
          } else {
            throw new Error('사용자 생성 실패');
          }
        } catch (createError: any) {
          console.error('❌ members에서 users 생성 실패:', createError);
          throw new Error('사용자를 찾을 수 없거나 계정이 비활성화되었습니다.');
        }
      }

      const user = users[0];

      // 2. community_admin 역할 체크 - 웹 로그인 차단
      if (user.role === 'community_admin') {
        throw new Error('커뮤니티 회원은 웹 로그인이 불가능합니다. 모바일 앱을 다운로드하여 이용해주세요.');
      }

      // 3. 비밀번호 검증은 현재는 skip (실제로는 bcrypt 등으로 해시 비교해야 함)
      // TODO: 실제 환경에서는 bcrypt.compare(password, users.hashed_password) 사용

      // 4. 세션 정보 생성 (localStorage에 저장용)
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

      // 5. 로컬스토리지에 저장
      console.log('💾 세션 저장 중...', sessionData.user);
      localStorage.setItem('supabase_session', JSON.stringify(sessionData));

      // 기존 PrivateRoute 호환성을 위해 access_token도 별도 저장
      localStorage.setItem('access_token', sessionData.access_token);
      console.log('🔑 호환성을 위한 access_token 저장 완료');

      console.log('🎉 로그인 성공!');

      // 보안 로그 기록
      try {
        const { supabaseApiService } = await import('./supabaseApiService');
        await supabaseApiService.securityLogs.recordLogin({
          user_id: sessionData.user.id,
          user_name: sessionData.user.full_name || sessionData.user.username || sessionData.user.email,
          user_email: sessionData.user.email,
          success: true,
          church_id: sessionData.user.church_id,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          location: await getLocationInfo()
        });
        console.log('✅ 로그인 보안 로그 기록 완료');
      } catch (logError) {
        console.error('⚠️ 로그인 보안 로그 기록 실패:', logError);
        // 로그 기록 실패는 로그인 프로세스를 방해하지 않음
      }

      return {
        user: sessionData.user,
        session: sessionData,
        profile: sessionData.user
      };

    } catch (error: any) {
      console.error('💥 로그인 에러:', error);

      // 로그인 실패 보안 로그 기록
      try {
        const { supabaseApiService } = await import('./supabaseApiService');
        await supabaseApiService.securityLogs.recordLogin({
          user_id: null,
          user_name: null,
          user_email: email,
          success: false,
          church_id: null,
          ip_address: await getClientIP(),
          user_agent: navigator.userAgent,
          location: await getLocationInfo(),
          details: {
            error_message: error.message,
            attempted_email: email
          }
        });
        console.log('✅ 로그인 실패 보안 로그 기록 완료');
      } catch (logError) {
        console.error('⚠️ 로그인 실패 보안 로그 기록 실패:', logError);
      }

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
  },

  // 비밀번호 업데이트
  updatePassword: async (newPassword: string) => {
    try {
      const currentUser = await supabaseAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인이 필요합니다.');
      }

      // users 테이블에서 비밀번호 업데이트
      // TODO: 실제 환경에서는 bcrypt로 해시화해야 함
      const { error } = await supabase
        .from('users')
        .update({
          hashed_password: newPassword, // 실제 컬럼명 사용
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.user.id);

      if (error) {
        console.error('❌ 비밀번호 업데이트 오류:', error);
        throw new Error('비밀번호 변경에 실패했습니다.');
      }

      console.log('✅ 비밀번호 업데이트 성공');

      // members 테이블에서 해당 사용자 찾아서 invitation_status를 'active'로 업데이트
      try {
        const { error: memberUpdateError } = await supabase
          .from('members')
          .update({
            invitation_status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('email', currentUser.user.email);

        if (memberUpdateError) {
          console.error('⚠️ members 테이블 invitation_status 업데이트 실패:', memberUpdateError);
          // 이 에러는 비밀번호 변경 자체를 실패시키지 않음
        } else {
          console.log('✅ invitation_status를 active로 업데이트 완료');
        }
      } catch (memberError) {
        console.error('⚠️ members 테이블 업데이트 중 에러:', memberError);
        // 이 에러는 비밀번호 변경 자체를 실패시키지 않음
      }

      return true;
    } catch (error: any) {
      console.error('💥 비밀번호 업데이트 에러:', error);
      throw new Error(error.message || '비밀번호 변경에 실패했습니다.');
    }
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