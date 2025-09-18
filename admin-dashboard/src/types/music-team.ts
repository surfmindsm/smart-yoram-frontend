/**
 * 음악팀 모집/지원 관련 타입 정의
 *
 * @description 음악팀 모집, 음악팀 지원 관련 타입들을 정의합니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

import {
  CommunityBasePost,
  ContactInfo,
  LocationInfo,
  DateInfo,
  CommunityStatus
} from './community-common';

// 음악팀 모집 인터페이스
export interface MusicTeamRecruitment extends CommunityBasePost, ContactInfo, LocationInfo, DateInfo {
  church_name: string;
  recruitment_type: RecruitmentType;
  instruments_needed: InstrumentType[];
  team_type: TeamType;
  schedule?: string;
  rehearsal_time?: string;
  performance_schedule?: string;
  requirements?: string;
  compensation?: string;
  experience_required?: MusicExperienceLevel;
  applications?: number;
  recruitment_deadline?: string;
}

// 음악팀 지원 인터페이스
export interface MusicTeamSeeker extends CommunityBasePost, ContactInfo, LocationInfo {
  name: string;
  team_name?: string;
  instrument: InstrumentType;
  instruments?: InstrumentType[]; // 호환성을 위해 유지
  experience: string;
  portfolio: string;
  preferred_location: string[];
  available_days: string[];
  available_time?: string;
  team_experience?: string[];
  introduction?: string;
  matches?: number;
  applications?: number;
}

// 악기/파트 타입
export type InstrumentType =
  | '보컬' | '리드보컬' | '서브보컬' | '코러스'
  | '피아노' | '키보드' | '오르간'
  | '어쿠스틱 기타' | '일렉트릭 기타' | '베이스'
  | '드럼' | '퍼커션'
  | '바이올린' | '첼로' | '플루트' | '색소폰' | '트럼펫'
  | '지휘' | '작곡/편곡' | '음향'
  | '기타';

// 팀 형태 타입
export type TeamType =
  | '찬양팀' | '워십팀' | '어쿠스틱 팀' | '밴드'
  | '오케스트라' | '합창단' | '무용팀'
  | '현재 솔로 활동' | '기타';

// 모집 유형 타입
export type RecruitmentType = 'new_member' | 'substitute' | 'project' | 'permanent';

// 경력 레벨 타입 (음악 특화)
export type MusicExperienceLevel = '입문' | '초급' | '중급' | '고급' | '전문가' | '무관';

// 음악팀 상태 타입
export type MusicTeamStatus = Extract<CommunityStatus, 'active' | 'completed' | 'cancelled'>;

// 활동 가능 요일 타입
export type AvailableDay = '월요일' | '화요일' | '수요일' | '목요일' | '금요일' | '토요일' | '일요일';

// 활동 가능 시간대 타입
export type AvailableTime = '오전' | '오후' | '저녁' | '야간' | '상시' | '협의';

// 보상 타입 타입
export type CompensationType = '무보수' | '실비지원' | '소정의 사례' | '협의';

// 필터 옵션 (음악팀 모집)
export interface MusicRecruitmentFilterOptions {
  instrument?: InstrumentType | 'all';
  team_type?: TeamType | 'all';
  experience_level?: MusicExperienceLevel | 'all';
  compensation_type?: CompensationType | 'all';
  schedule_day?: AvailableDay | 'all';
  schedule_time?: AvailableTime | 'all';
  location?: string;
}

// 필터 옵션 (음악팀 지원자)
export interface MusicSeekerFilterOptions {
  instrument?: InstrumentType | 'all';
  team_type?: TeamType | 'all';
  experience_level?: MusicExperienceLevel | 'all';
  available_day?: AvailableDay | 'all';
  available_time?: AvailableTime | 'all';
  preferred_location?: string;
  has_team_experience?: boolean;
}

// 생성/수정용 DTO 타입들
export interface CreateMusicRecruitmentDTO {
  title: string;
  description?: string;
  church_name: string;
  recruitment_type: RecruitmentType;
  instruments_needed: InstrumentType[];
  team_type: TeamType;
  location: string;
  schedule?: string;
  rehearsal_time?: string;
  requirements?: string;
  compensation?: string;
  experience_required?: MusicExperienceLevel;
  contact_phone: string;
  contact_email?: string;
  recruitment_deadline?: string;
}

export interface CreateMusicSeekerDTO {
  title: string;
  name: string;
  team_name?: string;
  instrument: InstrumentType;
  experience: string;
  portfolio: string;
  preferred_location: string[];
  available_days: AvailableDay[];
  available_time?: AvailableTime;
  contact_phone: string;
  contact_email?: string;
  team_experience?: string[];
  introduction?: string;
}

// 업데이트용 DTO 타입들 (Partial)
export type UpdateMusicRecruitmentDTO = Partial<CreateMusicRecruitmentDTO>;
export type UpdateMusicSeekerDTO = Partial<CreateMusicSeekerDTO>;

// 오디션 관련 인터페이스
export interface MusicAudition {
  id: number;
  recruitment_id: number;
  seeker_id: number;
  seeker_name: string;
  instrument: InstrumentType;
  audition_date?: string;
  audition_location?: string;
  audition_notes?: string;
  status: AuditionStatus;
  result?: string;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

// 오디션 상태 타입
export type AuditionStatus = 'scheduled' | 'completed' | 'passed' | 'failed' | 'cancelled';

// 음악 장르 타입 (확장 가능)
export type MusicGenre =
  | 'CCM' | '워십' | '가스펠' | '찬송가'
  | '클래식' | '팝' | '록' | '재즈'
  | '인디' | '포크' | '기타';

// 연주 레벨 평가 인터페이스
export interface SkillAssessment {
  instrument: InstrumentType;
  technical_skill: 1 | 2 | 3 | 4 | 5;
  musical_expression: 1 | 2 | 3 | 4 | 5;
  team_coordination: 1 | 2 | 3 | 4 | 5;
  sight_reading?: 1 | 2 | 3 | 4 | 5;
  improvisation?: 1 | 2 | 3 | 4 | 5;
  comments?: string;
}