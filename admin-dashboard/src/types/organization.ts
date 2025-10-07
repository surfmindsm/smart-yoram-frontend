// Organization Management Types
// Types for church organization management system

export interface ChurchOrganization {
  id: string;
  church_id: number;
  name: string;
  description?: string;
  organization_type: OrganizationType;
  parent_id?: string;
  level: number;
  sort_order: number;
  leader_id?: number;
  contact_phone?: string;
  contact_email?: string;
  meeting_schedule?: string;
  meeting_location?: string;
  is_active: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;

  // Computed fields for UI
  children?: ChurchOrganization[];
  leader_name?: string;
  parent_name?: string;
}

export interface MemberOrganization {
  id: string;
  member_id: number;
  organization_id: string;
  role: MemberRole;
  assigned_at: string;
  assigned_by?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Joined data
  member_name?: string;
  organization_name?: string;
  assigner_name?: string;
}

export interface OrganizationActivity {
  id: string;
  organization_id: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  activity_date?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  attendee_count: number;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;

  // Joined data
  organization_name?: string;
  creator_name?: string;
}

export type OrganizationType =
  | 'cell_group'    // 셀그룹
  | 'ministry_team' // 사역팀
  | 'custom';       // 사용자정의

export type MemberRole =
  | 'leader'     // 리더
  | 'sub_leader' // 부리더
  | 'member';    // 일반 멤버

export type ActivityType =
  | 'meeting'    // 모임
  | 'event'      // 이벤트
  | 'service'    // 예배
  | 'training'   // 훈련
  | 'outreach'   // 전도
  | 'fellowship'; // 친교

// Form data types
export interface OrganizationFormData {
  name: string;
  description: string;
  organization_type: OrganizationType;
  parent_id: string;
  leader_id: number | null;
  contact_phone: string;
  contact_email: string;
  meeting_schedule: string;
  meeting_location: string;
}

export interface MemberAssignmentFormData {
  member_id: number;
  organization_id: string;
  role: MemberRole;
  notes: string;
}

export interface ActivityFormData {
  organization_id: string;
  activity_type: ActivityType;
  title: string;
  description: string;
  activity_date: string;
  start_time: string;
  end_time: string;
  location: string;
  attendee_count: number;
  notes: string;
}

// API Response types
export interface OrganizationListResponse {
  organizations: ChurchOrganization[];
  total_count: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface MemberOrganizationListResponse {
  assignments: MemberOrganization[];
  total_count: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface OrganizationStatsResponse {
  organization_id: string;
  organization_name: string;
  total_members: number;
  active_members: number;
  leaders_count: number;
  gender_distribution: {
    male: number;
    female: number;
    unknown: number;
  };
  age_distribution: {
    '0-19': number;
    '20-29': number;
    '30-39': number;
    '40-49': number;
    '50-59': number;
    '60+': number;
  };
  recent_activities: number;
  last_activity_date?: string;
}

// UI helper types
export interface OrganizationTreeNode extends ChurchOrganization {
  children: OrganizationTreeNode[];
  expanded: boolean;
  selected: boolean;
}

export interface OrganizationFilter {
  search: string;
  organization_type: OrganizationType | 'all';
  is_active: boolean | 'all';
  parent_id: string | 'all';
}

export interface MemberFilter {
  search: string;
  organization_id: string | 'all';
  role: MemberRole | 'all';
  is_active: boolean | 'all';
}

// Constants
export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, string> = {
  cell_group: '셀그룹',
  ministry_team: '사역팀',
  custom: '사용자정의'
};

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  leader: '리더',
  sub_leader: '부리더',
  member: '멤버'
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  meeting: '모임',
  event: '이벤트',
  service: '예배',
  training: '훈련',
  outreach: '전도',
  fellowship: '친교'
};

// Validation helpers
export const validateOrganizationForm = (data: Partial<OrganizationFormData>): string[] => {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push('조직명을 입력해주세요.');
  }

  if (!data.organization_type) {
    errors.push('조직 유형을 선택해주세요.');
  }

  if (data.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
    errors.push('올바른 이메일 형식을 입력해주세요.');
  }

  return errors;
};

export const validateMemberAssignmentForm = (data: Partial<MemberAssignmentFormData>): string[] => {
  const errors: string[] = [];

  if (!data.member_id) {
    errors.push('교인을 선택해주세요.');
  }

  if (!data.organization_id) {
    errors.push('조직을 선택해주세요.');
  }

  if (!data.role) {
    errors.push('역할을 선택해주세요.');
  }

  return errors;
};