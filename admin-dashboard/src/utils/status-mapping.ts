// 커뮤니티 상태값 매핑 유틸리티 (마이그레이션 가이드 준수)

export type CommunityStatus = "active" | "completed" | "cancelled" | "paused";

// 기존 상태값을 새로운 통일된 상태값으로 매핑
export const mapToStandardStatus = (oldStatus: string): CommunityStatus => {
  const statusMapping: { [key: string]: CommunityStatus } = {
    // 커뮤니티 공유/판매
    "available": "active",
    "reserved": "active",
    "completed": "completed",

    // 구인/구직 게시판
    "open": "active",
    "active": "active",
    "closed": "completed",
    "filled": "completed",

    // 교회 행사
    "upcoming": "active",
    "ongoing": "active",
    "cancelled": "cancelled",

    // 기타 공통
    "paused": "paused",
    "inactive": "paused"
  };

  return statusMapping[oldStatus.toLowerCase()] || "active";
};

// 표준 상태값을 한국어 라벨로 변환
export const getStatusLabel = (status: CommunityStatus): string => {
  const labels: { [key in CommunityStatus]: string } = {
    active: '활성',
    completed: '완료',
    cancelled: '취소',
    paused: '일시중지'
  };

  return labels[status] || '알수없음';
};

// 상태값에 따른 CSS 클래스 반환
export const getStatusClass = (status: CommunityStatus): string => {
  const classMapping: { [key in CommunityStatus]: string } = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    paused: 'bg-yellow-100 text-yellow-800'
  };

  return classMapping[status] || 'bg-gray-100 text-gray-800';
};

// 상태값 필터 옵션 생성
export const getStatusFilterOptions = () => [
  { value: 'all', label: '전체 상태' },
  { value: 'active', label: '활성' },
  { value: 'completed', label: '완료' },
  { value: 'cancelled', label: '취소' },
  { value: 'paused', label: '일시중지' }
];

// 레거시 상태값 체크 (개발 환경에서 사용)
export const checkLegacyStatus = (statuses: string[]): string[] => {
  const knownStatuses = [
    'active', 'completed', 'cancelled', 'paused',
    'available', 'reserved', 'open', 'closed', 'filled',
    'upcoming', 'ongoing', 'inactive'
  ];

  return statuses.filter(status =>
    !knownStatuses.includes(status.toLowerCase())
  );
};