/**
 * 교인 직분(Position) 2단계 계층 구조 관리 상수
 *
 * 백엔드 정책:
 * - position_main: 대분류 (CLERGY, ELDER, DEACONESS, DEACON, MEMBER)
 * - position_detail: 세부 직분 (SENIOR_PASTOR, EMERITUS_ELDER, HONORARY_DEACONESS 등)
 * - 주소록 필터링은 position_category 사용
 */

// ===== 1. 직분 대분류 (position_main) =====
export const POSITION_MAIN = {
  CLERGY: 'CLERGY',                 // 교역자
  ELDER: 'ELDER',                   // 장로
  DEACONESS: 'DEACONESS',           // 권사
  DEACON: 'DEACON',                 // 집사
  CHURCH_SCHOOL: 'CHURCH_SCHOOL',   // 교회학교
  MEMBER: 'MEMBER',                 // 성도
} as const;

export type PositionMain = typeof POSITION_MAIN[keyof typeof POSITION_MAIN];

// ===== 2. 직분 세부 (position_detail) =====
export const POSITION_DETAIL = {
  // 교역자 계열
  SENIOR_PASTOR: 'SENIOR_PASTOR',                     // 담임목사
  EMERITUS_PASTOR: 'EMERITUS_PASTOR',                 // 원로목사
  ASSOCIATE_PASTOR: 'ASSOCIATE_PASTOR',               // 부목사
  COOPERATE_PASTOR: 'COOPERATE_PASTOR',               // 협동목사
  EVANGELIST: 'EVANGELIST',                           // 전도사
  INTERN_EVANGELIST: 'INTERN_EVANGELIST',             // 전임전도사(수련과정)
  EDUCATION_EVANGELIST: 'EDUCATION_EVANGELIST',       // 교육담당전도사

  // 장로 계열
  ACTIVE_ELDER: 'ACTIVE_ELDER',                       // 시무장로
  EMERITUS_ELDER: 'EMERITUS_ELDER',                   // 원로장로
  TRANSFERRED_EMERITUS_ELDER: 'TRANSFERRED_EMERITUS_ELDER', // 이명은퇴장로

  // 권사 계열
  HONORARY_DEACONESS: 'HONORARY_DEACONESS',           // 명예권사
  ACTIVE_DEACONESS: 'ACTIVE_DEACONESS',               // 시무권사

  // 집사 계열
  HONORARY_DEACON: 'HONORARY_DEACON',                 // 명예집사
  PROBATIONARY_DEACON: 'PROBATIONARY_DEACON',         // 서리집사
  ACTIVE_DEACON: 'ACTIVE_DEACON',                     // 집사
  ORDAINED_DEACON: 'ORDAINED_DEACON',                 // 안수집사

  // 교회학교 부서
  INFANT: 'INFANT',                                   // 영아부
  KINDERGARTEN: 'KINDERGARTEN',                       // 유치부
  YOUNG_CHILDREN: 'YOUNG_CHILDREN',                   // 유년부
  ELEMENTARY: 'ELEMENTARY',                           // 초등부
  JUNIOR: 'JUNIOR',                                   // 소년부
  MIDDLE_SCHOOL: 'MIDDLE_SCHOOL',                     // 중등부
  HIGH_SCHOOL: 'HIGH_SCHOOL',                         // 고등부
  YOUTH: 'YOUTH',                                     // 청년부

  // 기타
  TEACHER: 'TEACHER',                                 // 교사
  STUDENT: 'STUDENT',                                 // 학생
} as const;

export type PositionDetail = typeof POSITION_DETAIL[keyof typeof POSITION_DETAIL];

// ===== 3. 한글 레이블 매핑 =====
export const POSITION_MAIN_LABELS: Record<PositionMain, string> = {
  CLERGY: '교역자',
  ELDER: '장로',
  DEACONESS: '권사',
  DEACON: '집사',
  CHURCH_SCHOOL: '교회학교',
  MEMBER: '성도',
};

export const POSITION_DETAIL_LABELS: Record<PositionDetail, string> = {
  // 교역자
  SENIOR_PASTOR: '담임목사',
  EMERITUS_PASTOR: '원로목사',
  ASSOCIATE_PASTOR: '부목사',
  COOPERATE_PASTOR: '협동목사',
  EVANGELIST: '전도사',
  INTERN_EVANGELIST: '전임전도사',
  EDUCATION_EVANGELIST: '교육담당전도사',

  // 장로
  ACTIVE_ELDER: '시무장로',
  EMERITUS_ELDER: '원로장로',
  TRANSFERRED_EMERITUS_ELDER: '이명은퇴장로',

  // 권사
  HONORARY_DEACONESS: '명예권사',
  ACTIVE_DEACONESS: '시무권사',

  // 집사
  HONORARY_DEACON: '명예집사',
  PROBATIONARY_DEACON: '서리집사',
  ACTIVE_DEACON: '집사',
  ORDAINED_DEACON: '안수집사',

  // 교회학교 부서
  INFANT: '영아부',
  KINDERGARTEN: '유치부',
  YOUNG_CHILDREN: '유년부',
  ELEMENTARY: '초등부',
  JUNIOR: '소년부',
  MIDDLE_SCHOOL: '중등부',
  HIGH_SCHOOL: '고등부',
  YOUTH: '청년부',

  // 기타
  TEACHER: '교사',
  STUDENT: '학생',
};

// ===== 4. 계층 구조: position_main → position_detail 매핑 =====
export const POSITION_HIERARCHY: Record<PositionMain, PositionDetail[]> = {
  CLERGY: [
    POSITION_DETAIL.SENIOR_PASTOR,
    POSITION_DETAIL.EMERITUS_PASTOR,
    POSITION_DETAIL.ASSOCIATE_PASTOR,
    POSITION_DETAIL.COOPERATE_PASTOR,
    POSITION_DETAIL.EVANGELIST,
    POSITION_DETAIL.INTERN_EVANGELIST,
    POSITION_DETAIL.EDUCATION_EVANGELIST,
  ],
  ELDER: [
    POSITION_DETAIL.ACTIVE_ELDER,
    POSITION_DETAIL.EMERITUS_ELDER,
    POSITION_DETAIL.TRANSFERRED_EMERITUS_ELDER,
  ],
  DEACONESS: [
    POSITION_DETAIL.ACTIVE_DEACONESS,
    POSITION_DETAIL.HONORARY_DEACONESS,
  ],
  DEACON: [
    POSITION_DETAIL.ACTIVE_DEACON,
    POSITION_DETAIL.ORDAINED_DEACON,
    POSITION_DETAIL.PROBATIONARY_DEACON,
    POSITION_DETAIL.HONORARY_DEACON,
  ],
  CHURCH_SCHOOL: [
    POSITION_DETAIL.INFANT,
    POSITION_DETAIL.KINDERGARTEN,
    POSITION_DETAIL.YOUNG_CHILDREN,
    POSITION_DETAIL.ELEMENTARY,
    POSITION_DETAIL.JUNIOR,
    POSITION_DETAIL.MIDDLE_SCHOOL,
    POSITION_DETAIL.HIGH_SCHOOL,
    POSITION_DETAIL.YOUTH,
  ],
  MEMBER: [
    POSITION_DETAIL.TEACHER,
    POSITION_DETAIL.STUDENT,
  ],
};

// ===== 5. 주소록 카테고리 =====
export const POSITION_CATEGORIES = {
  CLERGY: 'CLERGY',           // 교역자
  ELDER: 'ELDER',             // 장로
  DEACONESS: 'DEACONESS',     // 권사
  DEACON: 'DEACON',           // 집사
  YOUTH: 'YOUTH',             // 청년 (20-35세)
  CHILDREN: 'CHILDREN',       // 교회학교 (0-19세)
  MEMBER: 'MEMBER',           // 성도
} as const;

export type PositionCategory = typeof POSITION_CATEGORIES[keyof typeof POSITION_CATEGORIES];

export const CATEGORY_LABELS: Record<PositionCategory, string> = {
  CLERGY: '교역자',
  ELDER: '장로',
  DEACONESS: '권사',
  DEACON: '집사',
  YOUTH: '청년',
  CHILDREN: '교회학교',
  MEMBER: '성도',
};

// ===== 6. 관리자 대시보드용 드롭다운 옵션 =====
export const ADMIN_POSITION_OPTIONS = [
  {
    mainValue: POSITION_MAIN.MEMBER,
    mainLabel: '성도',
    details: [] // 세부 옵션 없음 (성도는 단일 선택)
  },
  {
    mainValue: POSITION_MAIN.CLERGY,
    mainLabel: '교역자',
    details: [
      { value: POSITION_DETAIL.SENIOR_PASTOR, label: '담임목사' },
      { value: POSITION_DETAIL.EMERITUS_PASTOR, label: '원로목사' },
      { value: POSITION_DETAIL.ASSOCIATE_PASTOR, label: '부목사' },
      { value: POSITION_DETAIL.COOPERATE_PASTOR, label: '협동목사' },
      { value: POSITION_DETAIL.EVANGELIST, label: '전도사' },
      { value: POSITION_DETAIL.INTERN_EVANGELIST, label: '전임전도사' },
      { value: POSITION_DETAIL.EDUCATION_EVANGELIST, label: '교육담당전도사' },
    ]
  },
  {
    mainValue: POSITION_MAIN.ELDER,
    mainLabel: '장로',
    details: [
      { value: POSITION_DETAIL.ACTIVE_ELDER, label: '시무장로' },
      { value: POSITION_DETAIL.EMERITUS_ELDER, label: '원로장로' },
      { value: POSITION_DETAIL.TRANSFERRED_EMERITUS_ELDER, label: '이명은퇴장로' },
    ]
  },
  {
    mainValue: POSITION_MAIN.DEACONESS,
    mainLabel: '권사',
    details: [
      { value: POSITION_DETAIL.ACTIVE_DEACONESS, label: '시무권사' },
      { value: POSITION_DETAIL.HONORARY_DEACONESS, label: '명예권사' },
    ]
  },
  {
    mainValue: POSITION_MAIN.DEACON,
    mainLabel: '집사',
    details: [
      { value: POSITION_DETAIL.ACTIVE_DEACON, label: '집사' },
      { value: POSITION_DETAIL.ORDAINED_DEACON, label: '안수집사' },
      { value: POSITION_DETAIL.PROBATIONARY_DEACON, label: '서리집사' },
      { value: POSITION_DETAIL.HONORARY_DEACON, label: '명예집사' },
    ]
  },
  {
    mainValue: POSITION_MAIN.CHURCH_SCHOOL,
    mainLabel: '교회학교',
    details: [
      { value: POSITION_DETAIL.INFANT, label: '영아부' },
      { value: POSITION_DETAIL.KINDERGARTEN, label: '유치부' },
      { value: POSITION_DETAIL.YOUNG_CHILDREN, label: '유년부' },
      { value: POSITION_DETAIL.ELEMENTARY, label: '초등부' },
      { value: POSITION_DETAIL.JUNIOR, label: '소년부' },
      { value: POSITION_DETAIL.MIDDLE_SCHOOL, label: '중등부' },
      { value: POSITION_DETAIL.HIGH_SCHOOL, label: '고등부' },
      { value: POSITION_DETAIL.YOUTH, label: '청년부' },
    ]
  },
];

// 일반 사용자용 (모바일 앱) - 기본 직분만
export const USER_POSITION_OPTIONS = [
  {
    mainValue: POSITION_MAIN.MEMBER,
    mainLabel: '성도',
    details: []
  },
  {
    mainValue: POSITION_MAIN.CLERGY,
    mainLabel: '교역자',
    details: [
      { value: POSITION_DETAIL.EVANGELIST, label: '전도사' },
    ]
  },
  {
    mainValue: POSITION_MAIN.ELDER,
    mainLabel: '장로',
    details: [
      { value: POSITION_DETAIL.ACTIVE_ELDER, label: '장로' },
    ]
  },
  {
    mainValue: POSITION_MAIN.DEACONESS,
    mainLabel: '권사',
    details: [
      { value: POSITION_DETAIL.ACTIVE_DEACONESS, label: '권사' },
    ]
  },
  {
    mainValue: POSITION_MAIN.DEACON,
    mainLabel: '집사',
    details: [
      { value: POSITION_DETAIL.ACTIVE_DEACON, label: '집사' },
    ]
  },
];

// ===== 7. 헬퍼 함수 =====

/**
 * position_main 한글 레이블 반환
 */
export function getPositionMainLabel(main: PositionMain | string | null | undefined): string {
  if (!main) return '성도';
  return POSITION_MAIN_LABELS[main as PositionMain] || '성도';
}

/**
 * position_detail 한글 레이블 반환
 */
export function getPositionDetailLabel(detail: PositionDetail | string | null | undefined): string {
  if (!detail) return '';
  return POSITION_DETAIL_LABELS[detail as PositionDetail] || '';
}

/**
 * 전체 직분 표시 (대분류 + 세부)
 */
export function getFullPositionLabel(
  main: PositionMain | string | null | undefined,
  detail: PositionDetail | string | null | undefined
): string {
  const mainLabel = getPositionMainLabel(main);
  const detailLabel = getPositionDetailLabel(detail);

  if (detailLabel) {
    return detailLabel; // 세부 직분이 있으면 세부만 표시 (예: "담임목사", "시무장로")
  }
  return mainLabel; // 세부가 없으면 대분류만 표시 (예: "성도")
}

/**
 * 카테고리 한글 레이블 반환
 */
export function getCategoryLabel(category: PositionCategory | string): string {
  return CATEGORY_LABELS[category as PositionCategory] || '성도';
}

/**
 * position_main으로 카테고리 자동 변환
 */
export function getPositionCategory(
  main: PositionMain | string | null | undefined,
  birthDate?: string | Date | null
): PositionCategory {
  if (!main || main === POSITION_MAIN.MEMBER) {
    // 연령대 기반 카테고리 결정
    if (birthDate) {
      const age = calculateAge(birthDate);
      if (age !== null) {
        if (age <= 19) return POSITION_CATEGORIES.CHILDREN;
        if (age >= 20 && age <= 35) return POSITION_CATEGORIES.YOUTH;
      }
    }
    return POSITION_CATEGORIES.MEMBER;
  }

  // 직분 기반 카테고리
  switch (main) {
    case POSITION_MAIN.CLERGY:
      return POSITION_CATEGORIES.CLERGY;
    case POSITION_MAIN.ELDER:
      return POSITION_CATEGORIES.ELDER;
    case POSITION_MAIN.DEACONESS:
      return POSITION_CATEGORIES.DEACONESS;
    case POSITION_MAIN.DEACON:
      return POSITION_CATEGORIES.DEACON;
    case POSITION_MAIN.CHURCH_SCHOOL:
      return POSITION_CATEGORIES.CHILDREN;
    default:
      return POSITION_CATEGORIES.MEMBER;
  }
}

/**
 * 생년월일로 나이 계산
 */
function calculateAge(birthDate: string | Date): number | null {
  if (!birthDate) return null;

  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

// ===== 8. 엑셀 업로드용 한글 → 영문 코드 변환 =====

/**
 * 한글 레이블 → position_main 변환 (역매핑)
 * 엑셀 업로드 시 사용
 */
export function parsePositionMainFromKorean(koreanLabel: string | null | undefined): PositionMain | null {
  if (!koreanLabel) return null;

  const trimmed = koreanLabel.trim();

  // 정확히 일치하는 레이블 찾기
  for (const [key, label] of Object.entries(POSITION_MAIN_LABELS)) {
    if (label === trimmed) {
      return key as PositionMain;
    }
  }

  return null;
}

/**
 * 한글 레이블 → position_detail 변환 (역매핑)
 * 엑셀 업로드 시 사용
 */
export function parsePositionDetailFromKorean(koreanLabel: string | null | undefined): PositionDetail | null {
  if (!koreanLabel) return null;

  const trimmed = koreanLabel.trim();

  // 정확히 일치하는 레이블 찾기
  for (const [key, label] of Object.entries(POSITION_DETAIL_LABELS)) {
    if (label === trimmed) {
      return key as PositionDetail;
    }
  }

  return null;
}

/**
 * 직분 대분류 유효성 검증
 * 한글과 영문 코드 모두 허용
 */
export function isValidPositionMain(value: string | null | undefined): boolean {
  if (!value) return false;

  const trimmed = value.trim();

  // 영문 코드로 직접 입력된 경우
  if (trimmed in POSITION_MAIN_LABELS) {
    return true;
  }

  // 한글 레이블로 입력된 경우
  return parsePositionMainFromKorean(trimmed) !== null;
}

/**
 * 직분 세부 유효성 검증
 * 한글과 영문 코드 모두 허용
 */
export function isValidPositionDetail(value: string | null | undefined): boolean {
  if (!value) return false;

  const trimmed = value.trim();

  // 영문 코드로 직접 입력된 경우
  if (trimmed in POSITION_DETAIL_LABELS) {
    return true;
  }

  // 한글 레이블로 입력된 경우
  return parsePositionDetailFromKorean(trimmed) !== null;
}

/**
 * 직분 대분류 정규화 (한글 → 영문 코드 변환 또는 그대로 반환)
 */
export function normalizePositionMain(value: string | null | undefined): PositionMain | null {
  if (!value) return null;

  const trimmed = value.trim();

  // 이미 영문 코드인 경우
  if (trimmed in POSITION_MAIN_LABELS) {
    return trimmed as PositionMain;
  }

  // 한글인 경우 변환
  return parsePositionMainFromKorean(trimmed);
}

/**
 * 직분 세부 정규화 (한글 → 영문 코드 변환 또는 그대로 반환)
 */
export function normalizePositionDetail(value: string | null | undefined): PositionDetail | null {
  if (!value) return null;

  const trimmed = value.trim();

  // 이미 영문 코드인 경우
  if (trimmed in POSITION_DETAIL_LABELS) {
    return trimmed as PositionDetail;
  }

  // 한글인 경우 변환
  return parsePositionDetailFromKorean(trimmed);
}
