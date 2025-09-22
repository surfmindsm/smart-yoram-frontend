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

// 새로운 Role 상수 정의
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  CHURCH_SUPER_ADMIN: 'church_super_admin',
  CHURCH_ADMIN: 'church_admin',
  COMMUNITY_ADMIN: 'community_admin',
  MEMBER: 'member'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

/**
 * 기존 역할을 새로운 역할 시스템으로 정규화
 */
export const normalizeRole = (role?: string): string => {
  switch (role) {
    case 'system_admin': return ROLES.SUPER_ADMIN;
    case 'admin': return ROLES.CHURCH_ADMIN;
    case 'community_user': return ROLES.COMMUNITY_ADMIN;
    case 'member': return ROLES.MEMBER;
    case 'church_admin': return ROLES.CHURCH_ADMIN;
    // 새로운 역할들은 그대로 반환
    case ROLES.SUPER_ADMIN:
    case ROLES.CHURCH_SUPER_ADMIN:
    case ROLES.CHURCH_ADMIN:
    case ROLES.COMMUNITY_ADMIN:
    case ROLES.MEMBER:
      return role;
    default: return ROLES.MEMBER; // 기본값
  }
};

/**
 * 사용자가 슈퍼어드민인지 확인 (시스템 최고 관리자)
 */
export const isSuperAdmin = (user: User): boolean => {
  return user.church_id === 0 ||
         user.role === ROLES.SUPER_ADMIN ||
         user.role === 'system_admin'; // 기존 역할 호환성
};

/**
 * 사용자가 교회 슈퍼어드민인지 확인 (교회 최고 관리자)
 */
export const isChurchSuperAdmin = (user: User): boolean => {
  return user.role === ROLES.CHURCH_SUPER_ADMIN && user.church_id !== 0 && user.church_id !== 9998;
};

/**
 * 사용자가 교회 관리자인지 확인 (목회자/간사)
 */
export const isChurchAdmin = (user: User): boolean => {
  return (user.role === ROLES.CHURCH_ADMIN || user.role === 'admin') &&
         user.church_id !== 0 && user.church_id !== 9998;
};

/**
 * 사용자가 커뮤니티 관리자인지 확인
 */
export const isCommunityAdmin = (user: User): boolean => {
  return user.role === ROLES.COMMUNITY_ADMIN ||
         user.role === 'community_user' ||  // 기존 역할 호환성
         user.church_id === 9998;
};

/**
 * 사용자가 일반 교인인지 확인 (관리자 페이지 접근 불가)
 */
export const isMember = (user: User): boolean => {
  return user.role === ROLES.MEMBER || !user.role;
};

/**
 * 관리자 페이지 접근 권한 확인
 */
export const canAccessAdminDashboard = (user: User): boolean => {
  // Member는 관리자 페이지 접근 불가
  if (isMember(user)) {
    return false;
  }

  // 나머지 모든 admin 역할은 접근 가능
  return isSuperAdmin(user) || isChurchSuperAdmin(user) || isChurchAdmin(user) || isCommunityAdmin(user);
};

/**
 * 사용자가 다른 사용자의 role을 변경할 수 있는지 확인
 */
export const canManageUserRoles = (user: User): boolean => {
  return isSuperAdmin(user) || isChurchSuperAdmin(user);
};

/**
 * 특정 교회의 관리자인지 확인 (Church Super-Admin 또는 Church Admin)
 */
export const isChurchManager = (user: User): boolean => {
  return isChurchSuperAdmin(user) || isChurchAdmin(user);
};

/**
 * 사용자 역할의 우선순위를 반환 (숫자가 높을수록 높은 권한)
 */
export const getRolePriority = (role?: string): number => {
  switch (role) {
    case ROLES.SUPER_ADMIN: return 5;
    case ROLES.CHURCH_SUPER_ADMIN: return 4;
    case ROLES.CHURCH_ADMIN: return 3;
    case ROLES.COMMUNITY_ADMIN: return 2;
    case ROLES.MEMBER: return 1;
    default: return 0;
  }
};

/**
 * 역할 이름을 한국어로 변환
 */
export const getRoleDisplayName = (role?: string): string => {
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case 'system_admin': return '시스템 관리자';
    case ROLES.CHURCH_SUPER_ADMIN: return '교회 최고 관리자';
    case ROLES.CHURCH_ADMIN:
    case 'admin': return '교회 관리자';
    case ROLES.COMMUNITY_ADMIN:
    case 'community_user': return '커뮤니티 관리자';
    case ROLES.MEMBER: return '교인';
    default: return '미지정';
  }
};

/**
 * 역할별 접근 가능한 메뉴 반환
 */
export const getMenusForUser = (user: User) => {
  const menus = [];

  if (isSuperAdmin(user)) {
    // 슈퍼어드민은 모든 메뉴 접근 가능
    menus.push(...getSuperAdminMenus());
    menus.push(...getChurchMenus());
    menus.push(...getCommunityMenus());
  } else if (isChurchSuperAdmin(user)) {
    // 교회 슈퍼어드민은 교회 관리 + 역할 관리 메뉴
    menus.push(...getChurchMenus());
    menus.push({
      name: '관리자 권한 관리',
      path: '/admin-roles',
      icon: 'Shield'
    });
  } else if (isChurchAdmin(user)) {
    // 교회 관리자는 교회 관리 메뉴만
    menus.push(...getChurchMenus());
  } else if (isCommunityAdmin(user)) {
    // 커뮤니티 관리자는 커뮤니티 메뉴만
    menus.push(...getCommunityMenus());
  }

  return menus;
};

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
  },
  {
    name: '전체 교회 관리',
    path: '/all-churches',
    icon: 'Building'
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
  },
  {
    name: '목양 관리',
    path: '/pastoral-care',
    icon: 'Heart'
  },
  {
    name: '기도 요청',
    path: '/prayer-requests',
    icon: 'Hands'
  },
  {
    name: '오늘의 말씀',
    path: '/daily-verses',
    icon: 'Book'
  }
];

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