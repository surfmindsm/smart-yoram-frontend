// 사용자 권한 확인 유틸리티

export interface User {
  name?: string;
  email?: string;
  church_id?: number;
  role?: string;
}

export interface Church {
  id: number;
  name: string;
  subscription_plan?: string;
  is_community?: boolean;
}

/**
 * 사용자가 커뮤니티 전용 사용자인지 확인
 */
export const isCommunityUser = (user: User, church?: Church): boolean => {
  // church_id가 undefined인 경우 false 반환
  if (typeof user.church_id !== 'number') {
    return false;
  }

  // 방법 1: church_id가 9998인 경우 (커뮤니티 전용 테넌트)
  if (user.church_id === 9998) {
    return true;
  }

  // 방법 2: church 정보가 있는 경우 subscription_plan 확인
  if (church) {
    return church.subscription_plan === 'community' || church.is_community === true;
  }

  return false;
};

/**
 * 사용자가 슈퍼어드민인지 확인
 */
export const isSuperAdmin = (user: User): boolean => {
  return user.church_id === 0;
};

/**
 * 사용자가 교회 관리자인지 확인
 */
export const isChurchAdmin = (user: User, church?: Church): boolean => {
  return !isCommunityUser(user, church) && !isSuperAdmin(user);
};

/**
 * 커뮤니티 전용 메뉴 목록
 */
export const getCommunityMenus = () => [
  {
    name: '커뮤니티 홈',
    path: '/community',
    icon: 'Home'
  },
  {
    name: '무료 나눔(드림)',
    path: '/community/free-sharing',
    icon: 'Gift'
  },
  {
    name: '물품 판매',
    path: '/community/item-sale',
    icon: 'HandHeart'
  },
  {
    name: '물품 요청',
    path: '/community/item-request',  
    icon: 'MessageSquare'
  },
  {
    name: '사역자 모집',
    path: '/community/job-posting',
    icon: 'Briefcase'
  },
  {
    name: '사역자 지원',
    path: '/community/job-seeking',
    icon: 'User'
  },
  {
    name: '행사팀 모집',
    path: '/community/music-team-recruit',
    icon: 'Music'
  },
  {
    name: '행사팀 지원',
    path: '/community/music-team-seeking',
    icon: 'Users'
  },
  {
    name: '행사 소식',
    path: '/community/church-events',
    icon: 'Calendar'
  },
  {
    name: '내 글 관리',
    path: '/community/my-posts',
    icon: 'User'
  }
];

/**
 * 교회 관리 메뉴 목록
 */
export const getChurchMenus = () => [
  {
    name: '대시보드',
    path: '/dashboard',
    icon: 'BarChart3'
  },
  {
    name: '교인 관리',
    path: '/members',
    icon: 'Users'
  },
  {
    name: '회원 가입',
    path: '/add-member',
    icon: 'UserPlus'
  },
  {
    name: '교회 정보',
    path: '/church',
    icon: 'Building'
  },
  {
    name: '예배 일정',
    path: '/worship-schedule',
    icon: 'Calendar'
  },
  {
    name: '주보 관리',
    path: '/bulletins',
    icon: 'FileText'
  },
  {
    name: '공지사항',
    path: '/announcements',
    icon: 'Megaphone'
  },
  {
    name: '출석 관리',
    path: '/attendance',
    icon: 'CheckCircle'
  },
  {
    name: '헌금 관리',
    path: '/donations',
    icon: 'DollarSign'
  }
  // ... 기타 교회 관리 메뉴들
];

/**
 * 슈퍼어드민 전용 메뉴 목록
 */
export const getSuperAdminMenus = () => [
  {
    name: '커뮤니티 신청 관리',
    path: '/community-applications',
    icon: 'Users'
  },
  {
    name: '커뮤니티 관리',
    path: '/community/admin',
    icon: 'Shield'
  },
  {
    name: '시스템 공지사항',
    path: '/system-announcements',
    icon: 'Megaphone'
  },
  {
    name: '보안 로그',
    path: '/security-logs',
    icon: 'Shield'
  }
  // ... 기타 슈퍼어드민 메뉴들
];