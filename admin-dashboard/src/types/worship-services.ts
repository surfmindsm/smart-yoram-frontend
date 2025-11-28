/**
 * 예배 시간 관리 타입 정의
 *
 * @description 예배 시간 관리 관련 타입들을 정의합니다.
 * @version 1.0.0
 * @since 2025-11-28
 */

// 요일 타입
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=일요일, 1=월요일, ..., 6=토요일

// 요일 레이블
export const DAY_OF_WEEK_LABELS: Record<DayOfWeek, string> = {
  0: '일요일',
  1: '월요일',
  2: '화요일',
  3: '수요일',
  4: '목요일',
  5: '금요일',
  6: '토요일',
};

// 예배 유형 타입
export type ServiceType =
  | '주일예배'
  | '새벽예배'
  | '수요예배'
  | '금요예배'
  | '토요예배'
  | '특별예배'
  | '부흥회'
  | '기타';

// 대상 그룹 타입
export type TargetGroup =
  | '전체'
  | '성인'
  | '청년'
  | '청소년'
  | '어린이'
  | '유아'
  | '장년'
  | '시니어'
  | '남성'
  | '여성'
  | '새신자'
  | '기타';

// 예배 시간 인터페이스
export interface WorshipService {
  id: number;
  church_id: number;
  name: string;
  location: string | null;
  day_of_week: DayOfWeek | null;
  start_time: string; // HH:MM:SS 형식
  end_time: string | null; // HH:MM:SS 형식
  service_type: string | null;
  target_group: string | null;
  is_online: boolean | null;
  is_active: boolean | null;
  order_index: number | null;
  created_at: string;
  updated_at: string | null;
}

// 생성용 DTO
export interface CreateWorshipServiceDTO {
  church_id: number;
  name: string;
  location?: string;
  day_of_week?: DayOfWeek;
  start_time: string;
  end_time?: string;
  service_type?: ServiceType;
  target_group?: TargetGroup;
  is_online?: boolean;
  is_active?: boolean;
  order_index?: number;
}

// 수정용 DTO
export type UpdateWorshipServiceDTO = Partial<Omit<CreateWorshipServiceDTO, 'church_id'>>;

// 필터 옵션
export interface WorshipServiceFilterOptions {
  church_id?: number;
  day_of_week?: DayOfWeek | 'all';
  service_type?: ServiceType | 'all';
  target_group?: TargetGroup | 'all';
  is_online?: boolean;
  is_active?: boolean;
}

// 목록 조회 옵션
export interface WorshipServiceListOptions extends WorshipServiceFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort_by?: 'order_index' | 'day_of_week' | 'start_time' | 'name';
  sort_order?: 'asc' | 'desc';
}

// 예배 시간 표시용 포맷 인터페이스
export interface WorshipServiceDisplay extends WorshipService {
  day_label: string; // 요일 한글 표시
  time_range: string; // "09:00 - 10:30" 형식
  status_label: string; // 활성/비활성 한글 표시
}
