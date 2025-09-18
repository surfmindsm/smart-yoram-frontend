/**
 * 커뮤니티 관련 유틸리티 함수들
 *
 * @description 커뮤니티 전반에서 사용되는 헬퍼 함수들을 모아놓은 파일입니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

import {
  CommunityModule,
  CommunityBasePost,
  SharingCategory,
  JobType,
  InstrumentType,
  EventType
} from '../types';

/**
 * 커뮤니티 모듈별 라벨 반환
 */
export const getModuleLabel = (module: CommunityModule): string => {
  const labelMap: Record<CommunityModule, string> = {
    'sharing': '무료나눔',
    'request': '물품요청',
    'offer': '물품판매',
    'job-post': '구인공고',
    'job-seeker': '구직신청',
    'music-recruitment': '음악팀모집',
    'music-seeker': '음악팀지원',
    'church-event': '교회행사',
    'church-news': '교회소식'
  };

  return labelMap[module] || module;
};

/**
 * 커뮤니티 모듈별 아이콘 클래스 반환
 */
export const getModuleIcon = (module: CommunityModule): string => {
  const iconMap: Record<CommunityModule, string> = {
    'sharing': '🎁',
    'request': '🙏',
    'offer': '💰',
    'job-post': '💼',
    'job-seeker': '👨‍💼',
    'music-recruitment': '🎵',
    'music-seeker': '🎤',
    'church-event': '📅',
    'church-news': '📰'
  };

  return iconMap[module] || '📋';
};

/**
 * 커뮤니티 모듈별 색상 클래스 반환
 */
export const getModuleColor = (module: CommunityModule): string => {
  const colorMap: Record<CommunityModule, string> = {
    'sharing': 'text-green-600 bg-green-100',
    'request': 'text-blue-600 bg-blue-100',
    'offer': 'text-purple-600 bg-purple-100',
    'job-post': 'text-orange-600 bg-orange-100',
    'job-seeker': 'text-orange-700 bg-orange-50',
    'music-recruitment': 'text-pink-600 bg-pink-100',
    'music-seeker': 'text-pink-700 bg-pink-50',
    'church-event': 'text-indigo-600 bg-indigo-100',
    'church-news': 'text-gray-600 bg-gray-100'
  };

  return colorMap[module] || 'text-gray-600 bg-gray-100';
};

/**
 * 카테고리별 라벨 반환
 */
export const getCategoryLabel = (
  category: string,
  module?: CommunityModule
): string => {
  // 공유/판매 카테고리
  const sharingCategoryLabels: Record<string, string> = {
    '전자제품': '전자제품',
    '가구': '가구',
    '도서': '도서',
    '의류': '의류',
    '생활용품': '생활용품',
    '스포츠': '스포츠용품',
    '취미': '취미용품',
    '악기': '악기',
    '기타': '기타'
  };

  // 구인/구직 카테고리
  const jobCategoryLabels: Record<string, string> = {
    '담임목사': '담임목사',
    '부목사': '부목사',
    '전도사': '전도사',
    '선교사': '선교사',
    '찬양사역자': '찬양사역자',
    '교육사역자': '교육사역자',
    '청소년사역자': '청소년사역자',
    '어린이사역자': '어린이사역자',
    '행정사역자': '행정사역자'
  };

  // 모듈에 따라 적절한 매핑 사용
  if (module?.includes('job')) {
    return jobCategoryLabels[category] || category;
  }

  return sharingCategoryLabels[category] || category;
};

/**
 * 악기/팀형태별 라벨 반환
 */
export const getInstrumentLabel = (instrument: string): string => {
  const labels: Record<string, string> = {
    '보컬': '보컬',
    '리드보컬': '리드보컬',
    '서브보컬': '서브보컬',
    '코러스': '코러스',
    '피아노': '피아노',
    '키보드': '키보드',
    '어쿠스틱 기타': '어쿠스틱 기타',
    '일렉트릭 기타': '일렉트릭 기타',
    '베이스': '베이스',
    '드럼': '드럼',
    '바이올린': '바이올린',
    '첼로': '첼로',
    '플루트': '플루트',
    '색소폰': '색소폰',
    '트럼펫': '트럼펫',
    '지휘': '지휘',
    '찬양팀': '찬양팀',
    '워십팀': '워십팀',
    '밴드': '밴드',
    '오케스트라': '오케스트라',
    '합창단': '합창단'
  };

  return labels[instrument] || instrument;
};

/**
 * 행사 타입별 라벨 반환
 */
export const getEventTypeLabel = (eventType: string): string => {
  const labels: Record<string, string> = {
    'seminar': '세미나',
    'revival': '부흥회',
    'concert': '찬양집회',
    'conference': '컨퍼런스',
    'workshop': '워크샵',
    'retreat': '수양회',
    'mission': '선교',
    'outreach': '전도',
    'fellowship': '교제',
    'service': '예배',
    'special_service': '특별예배',
    'wedding': '결혼식',
    'funeral': '장례식',
    'baptism': '세례식',
    'youth_event': '청년행사',
    'children_event': '어린이행사',
    'senior_event': '장년행사',
    'other': '기타'
  };

  return labels[eventType] || eventType;
};

/**
 * 연락처 정보 포맷팅
 */
export const formatContact = (phone?: string, email?: string): string => {
  const parts: string[] = [];

  if (phone) {
    parts.push(`전화: ${phone}`);
  }

  if (email) {
    parts.push(`이메일: ${email}`);
  }

  return parts.join(' | ') || '연락처 없음';
};

/**
 * 연락처 유효성 검사
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\d{2,3}-\d{3,4}-\d{4}|\d{10,11})$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * 게시글 요약 생성
 */
export const generatePostSummary = (
  post: CommunityBasePost,
  maxLength: number = 100
): string => {
  let summary = post.description || post.title;

  if (summary.length > maxLength) {
    summary = summary.substring(0, maxLength) + '...';
  }

  return summary;
};

/**
 * 게시글 검색 점수 계산
 */
export const calculateSearchScore = (
  post: CommunityBasePost,
  query: string
): number => {
  const searchQuery = query.toLowerCase();
  let score = 0;

  // 제목에서 매칭 (가중치 높음)
  if (post.title.toLowerCase().includes(searchQuery)) {
    score += 50;
  }

  // 설명에서 매칭
  if (post.description?.toLowerCase().includes(searchQuery)) {
    score += 30;
  }

  // 작성자명에서 매칭
  if (post.author_name.toLowerCase().includes(searchQuery)) {
    score += 20;
  }

  // 교회명에서 매칭
  if (post.church_name?.toLowerCase().includes(searchQuery)) {
    score += 15;
  }

  return score;
};

/**
 * 게시글 정렬
 */
export const sortPosts = <T extends CommunityBasePost>(
  posts: T[],
  sortBy: 'latest' | 'oldest' | 'most_viewed' | 'most_liked' | 'title_asc' | 'title_desc'
): T[] => {
  const sorted = [...posts];

  switch (sortBy) {
    case 'latest':
      return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    case 'oldest':
      return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    case 'most_viewed':
      return sorted.sort((a, b) => b.view_count - a.view_count);

    case 'most_liked':
      return sorted.sort((a, b) => b.likes - a.likes);

    case 'title_asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title, 'ko-KR'));

    case 'title_desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title, 'ko-KR'));

    default:
      return sorted;
  }
};

/**
 * 게시글 필터링
 */
export const filterPosts = <T extends CommunityBasePost>(
  posts: T[],
  filters: {
    status?: string;
    author?: string;
    church?: string;
    dateFrom?: string;
    dateTo?: string;
    query?: string;
  }
): T[] => {
  return posts.filter(post => {
    // 상태 필터
    if (filters.status && filters.status !== 'all' && post.status !== filters.status) {
      return false;
    }

    // 작성자 필터
    if (filters.author && !post.author_name.toLowerCase().includes(filters.author.toLowerCase())) {
      return false;
    }

    // 교회 필터
    if (filters.church && !post.church_name?.toLowerCase().includes(filters.church.toLowerCase())) {
      return false;
    }

    // 날짜 필터
    if (filters.dateFrom) {
      const postDate = new Date(post.created_at);
      const fromDate = new Date(filters.dateFrom);
      if (postDate < fromDate) {
        return false;
      }
    }

    if (filters.dateTo) {
      const postDate = new Date(post.created_at);
      const toDate = new Date(filters.dateTo);
      if (postDate > toDate) {
        return false;
      }
    }

    // 검색어 필터
    if (filters.query) {
      const searchQuery = filters.query.toLowerCase();
      const searchableText = [
        post.title,
        post.description,
        post.author_name,
        post.church_name
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchableText.includes(searchQuery)) {
        return false;
      }
    }

    return true;
  });
};

/**
 * 중복 게시글 제거
 */
export const deduplicatePosts = <T extends CommunityBasePost>(posts: T[]): T[] => {
  const seen = new Set<number>();
  return posts.filter(post => {
    if (seen.has(post.id)) {
      return false;
    }
    seen.add(post.id);
    return true;
  });
};

/**
 * 텍스트 하이라이트
 */
export const highlightText = (text: string, query: string): string => {
  if (!query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

/**
 * 파일 크기 포맷팅
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * URL 유효성 검사
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};