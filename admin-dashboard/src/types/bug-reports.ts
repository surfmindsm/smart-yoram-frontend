/**
 * 문의하기/버그 리포트 타입 정의
 */

export interface BugReport {
  id: number;
  user_id: number;
  church_id: number;
  issue_type: string;
  description: string;
  app_version?: string | null;
  platform?: string | null;
  os_version?: string | null;
  device_model?: string | null;
  status: 'pending' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface CreateBugReportRequest {
  issue_type: string;
  description: string;
  app_version?: string;
  platform?: string;
  os_version?: string;
  device_model?: string;
}

export interface BugReportListOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'in_progress' | 'resolved';
  issue_type?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const ISSUE_TYPES = [
  { value: 'bug', label: '버그/오류' },
  { value: 'feature', label: '기능 개선 요청' },
  { value: 'question', label: '사용 문의' },
  { value: 'other', label: '기타' },
] as const;
