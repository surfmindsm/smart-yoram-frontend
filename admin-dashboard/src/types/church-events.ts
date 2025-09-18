/**
 * 교회 행사 관련 타입 정의
 *
 * @description 교회 행사, 교회 소식 관련 타입들을 정의합니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

import {
  CommunityBasePost,
  ContactInfo,
  LocationInfo,
  ImageInfo,
  DateInfo,
  CommunityStatus
} from './community-common';

// 교회 행사 인터페이스
export interface ChurchEvent extends CommunityBasePost, ContactInfo, LocationInfo, ImageInfo, DateInfo {
  event_type: EventType;
  church_name?: string;
  organizer: string;
  target_audience?: string;
  participation_fee?: string;
  registration_required: boolean;
  registration_method?: string;
  registration_deadline?: string;
  capacity?: number;
  current_participants: number;
  registrations?: number;
  additional_info?: string;
  tags?: string[];
}

// 교회 소식 인터페이스
export interface ChurchNews extends CommunityBasePost, ContactInfo, LocationInfo, ImageInfo {
  content: string;
  category: NewsCategory;
  priority: NewsPriority;
  eventDate?: string;
  eventTime?: string;
  event_date?: string;
  event_time?: string;
  organizer: string;
  target_audience?: string;
  participation_fee?: string;
  registration_method?: string;
  registration_required?: boolean;
  registration_deadline?: string;
  contact_person?: string;
  additional_info?: string;
  tags?: string[];
}

// 행사 타입
export type EventType =
  | 'seminar' | 'revival' | 'concert' | 'conference'
  | 'workshop' | 'retreat' | 'mission' | 'outreach'
  | 'fellowship' | 'service' | 'special_service'
  | 'wedding' | 'funeral' | 'baptism'
  | 'youth_event' | 'children_event' | 'senior_event'
  | 'other';

// 소식 카테고리 타입
export type NewsCategory =
  | 'announcement' | 'event' | 'ministry' | 'mission'
  | 'education' | 'fellowship' | 'service' | 'special'
  | 'urgent' | 'general';

// 우선순위 타입
export type NewsPriority = 'urgent' | 'important' | 'normal';

// 교회 행사 상태 타입
export type EventStatus = Extract<CommunityStatus, 'active' | 'completed' | 'cancelled'>;

// 대상 청중 타입
export type TargetAudience =
  | '전체' | '성인' | '청년' | '청소년' | '어린이'
  | '장년' | '시니어' | '새신자' | '리더십'
  | '남성' | '여성' | '가족' | '기타';

// 참가비 타입
export type ParticipationFee =
  | '무료' | '1만원 이하' | '1-3만원' | '3-5만원' | '5만원 이상' | '별도 문의';

// 등록 방법 타입
export type RegistrationMethod =
  | '온라인 등록' | '전화 등록' | '현장 등록' | '이메일 등록'
  | '담당자 연락' | '교회 사무실' | '기타';

// 행사 규모 타입
export type EventScale = 'small' | 'medium' | 'large' | 'mega';

// 필터 옵션 (교회 행사)
export interface ChurchEventFilterOptions {
  event_type?: EventType | 'all';
  target_audience?: TargetAudience | 'all';
  registration_required?: boolean;
  fee_type?: ParticipationFee | 'all';
  date_from?: string;
  date_to?: string;
  location?: string;
  organizer?: string;
}

// 필터 옵션 (교회 소식)
export interface ChurchNewsFilterOptions {
  category?: NewsCategory | 'all';
  priority?: NewsPriority | 'all';
  target_audience?: TargetAudience | 'all';
  has_event_date?: boolean;
  organizer?: string;
}

// 교회 소식 목록 옵션 (별칭)
export interface ChurchNewsListOptions extends ChurchNewsFilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// 생성/수정용 DTO 타입들
export interface CreateChurchEventDTO {
  title: string;
  description: string;
  event_type: EventType;
  organizer: string;
  location: string;
  start_date: string;
  end_date?: string;
  target_audience?: TargetAudience;
  participation_fee?: string;
  registration_required: boolean;
  registration_method?: RegistrationMethod;
  registration_deadline?: string;
  capacity?: number;
  contact_phone: string;
  contact_email?: string;
  additional_info?: string;
  images?: string[];
  tags?: string[];
}

export interface CreateChurchNewsDTO {
  title: string;
  content: string;
  category: NewsCategory;
  priority: NewsPriority;
  event_date?: string;
  event_time?: string;
  location?: string;
  organizer: string;
  target_audience?: TargetAudience;
  participation_fee?: string;
  registration_method?: RegistrationMethod;
  registration_required?: boolean;
  registration_deadline?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  additional_info?: string;
  images?: string[];
  tags?: string[];
}

// 업데이트용 DTO 타입들 (Partial)
export type UpdateChurchEventDTO = Partial<CreateChurchEventDTO>;
export type UpdateChurchNewsDTO = Partial<CreateChurchNewsDTO>;

// 행사 참가 관련 인터페이스
export interface EventRegistration {
  id: number;
  event_id: number;
  participant_name: string;
  participant_email: string;
  participant_phone: string;
  participant_count: number;
  additional_requests?: string;
  registration_status: RegistrationStatus;
  payment_status?: PaymentStatus;
  registered_at: string;
  updated_at: string;
}

// 등록 상태 타입
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'waitlisted';

// 결제 상태 타입
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'not_required';

// 행사 통계 인터페이스
export interface EventStatistics {
  event_id: number;
  total_registrations: number;
  confirmed_registrations: number;
  cancelled_registrations: number;
  waitlisted_registrations: number;
  attendance_rate?: number;
  revenue?: number;
  feedback_count?: number;
  average_rating?: number;
}

// 행사 피드백 인터페이스
export interface EventFeedback {
  id: number;
  event_id: number;
  participant_name?: string;
  participant_email?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  content?: string;
  suggestions?: string;
  would_recommend: boolean;
  submitted_at: string;
}

// 행사 체크리스트 항목 인터페이스
export interface EventChecklistItem {
  id: number;
  event_id: number;
  task: string;
  description?: string;
  assigned_to?: string;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'preparation' | 'setup' | 'during' | 'cleanup' | 'followup';
}