/**
 * 구인/구직 관련 타입 정의
 *
 * @description 구인 공고, 구직 신청 관련 타입들을 정의합니다.
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

// 구인 공고 인터페이스
export interface JobPost extends CommunityBasePost, ContactInfo, LocationInfo, DateInfo {
  company_name: string;
  church_name?: string;
  company_intro?: string;
  position: string;
  job_type: JobType;
  employment_type: EmploymentType;
  salary_range?: string;
  requirements?: string;
  benefits?: string;
  required_documents?: string[];
  applications?: number;
  application_deadline?: string;
  work_schedule?: string;
  experience_required?: string;
}

// 구직 신청 인터페이스
export interface JobSeeker extends CommunityBasePost, ContactInfo, LocationInfo {
  name: string;
  ministry_field: string[];
  career: string;
  education: string;
  certifications: string[];
  introduction: string;
  preferred_location: string[];
  availability: string;
  resume_url?: string;
  portfolio_url?: string;
  matches?: number;
}

// 직무 타입
export type JobType =
  | '담임목사' | '부목사' | '전도사' | '선교사'
  | '찬양사역자' | '교육사역자' | '청소년사역자' | '어린이사역자'
  | '행정사역자' | '재정사역자' | '시설관리자'
  | '사회복지사' | '상담사역자' | '기타';

// 고용 형태 타입
export type EmploymentType = 'full-time' | 'part-time' | 'volunteer' | 'contract' | 'internship';

// 구인/구직 상태 타입
export type JobStatus = Extract<CommunityStatus, 'active' | 'completed' | 'cancelled'>;

// 경력 레벨 타입
export type ExperienceLevel = '신입' | '1-3년' | '4-7년' | '8-15년' | '15년 이상';

// 교육 수준 타입
export type EducationLevel = '고등학교' | '전문대학' | '대학교' | '대학원 석사' | '대학원 박사' | '신학교' | '신학대학원';

// 급여 범위 타입
export type SalaryRange =
  | '면접 후 결정' | '협의'
  | '200만원 이하' | '200-300만원' | '300-400만원' | '400-500만원' | '500만원 이상';

// 사역 분야 타입
export type MinistryField =
  | '설교사역' | '예배사역' | '찬양사역' | '교육사역'
  | '청소년사역' | '어린이사역' | '장년사역' | '시니어사역'
  | '전도사역' | '선교사역' | '상담사역' | '사회복지사역'
  | '행정사역' | '재정사역' | '시설관리' | '기타';

// 필터 옵션 (구인 공고)
export interface JobPostFilterOptions {
  position?: JobType | 'all';
  employment_type?: EmploymentType | 'all';
  salary_min?: number;
  salary_max?: number;
  experience_level?: ExperienceLevel | 'all';
  location?: string;
  company_type?: 'church' | 'organization' | 'all';
}

// 필터 옵션 (구직자)
export interface JobSeekerFilterOptions {
  ministry_field?: MinistryField | 'all';
  experience_level?: ExperienceLevel | 'all';
  education_level?: EducationLevel | 'all';
  preferred_location?: string;
  availability?: string;
}

// 생성/수정용 DTO 타입들
export interface CreateJobPostDTO {
  title: string;
  description?: string;
  company_name: string;
  company_intro?: string;
  position: JobType;
  job_type: JobType; // 호환성을 위해 유지
  employment_type: EmploymentType;
  location: string;
  salary_range?: string;
  requirements?: string;
  benefits?: string;
  required_documents?: string[];
  contact_phone: string;
  contact_email?: string;
  application_deadline?: string;
  work_schedule?: string;
}

export interface CreateJobSeekerDTO {
  title: string;
  name: string;
  ministry_field: MinistryField[];
  career: string;
  education: EducationLevel;
  certifications?: string[];
  introduction: string;
  preferred_location: string[];
  availability: string;
  contact_phone: string;
  contact_email?: string;
  resume_url?: string;
  portfolio_url?: string;
}

// 업데이트용 DTO 타입들 (Partial)
export type UpdateJobPostDTO = Partial<CreateJobPostDTO>;
export type UpdateJobSeekerDTO = Partial<CreateJobSeekerDTO>;

// 지원 관련 인터페이스
export interface JobApplication {
  id: number;
  job_post_id: number;
  applicant_id: number;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  cover_letter?: string;
  resume_url?: string;
  status: 'pending' | 'reviewing' | 'interviewed' | 'accepted' | 'rejected';
  applied_at: string;
  updated_at: string;
}

// 지원 상태 타입
export type ApplicationStatus = 'pending' | 'reviewing' | 'interviewed' | 'accepted' | 'rejected';