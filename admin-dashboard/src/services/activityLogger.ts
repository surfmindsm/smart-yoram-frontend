// 개인정보 접근 활동 자동 로깅 시스템
import { api } from './api';

export interface ActivityLog {
  action: 'view' | 'create' | 'update' | 'delete' | 'search' | 'login' | 'logout';
  resource: 'member' | 'attendance' | 'financial' | 'bulletin' | 'announcement' | 'system';
  target_id?: number | string;
  target_name?: string;
  page_path: string;
  page_name: string;
  details?: any;
  sensitive_data?: string[]; // 접근한 개인정보 필드들
}

class ActivityLogger {
  private static instance: ActivityLogger;
  private logQueue: ActivityLog[] = [];
  private isLogging = false;

  constructor() {
    this.initializeSession();
  }

  static getInstance(): ActivityLogger {
    if (!ActivityLogger.instance) {
      ActivityLogger.instance = new ActivityLogger();
    }
    return ActivityLogger.instance;
  }

  // 활동 로그 기록
  async log(activity: ActivityLog) {
    const logEntry = {
      ...activity,
      timestamp: new Date().toISOString(),
      user_id: this.getCurrentUserId(),
      session_id: this.getSessionId(),
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
    };

    this.logQueue.push(logEntry);
    this.processQueue();
  }

  // 개인정보 관련 활동들을 위한 편의 메서드들
  logMemberView(memberId: number, memberName: string, viewedFields: string[]) {
    this.log({
      action: 'view',
      resource: 'member',
      target_id: memberId,
      target_name: memberName,
      page_path: window.location.pathname,
      page_name: '교인 상세조회',
      sensitive_data: viewedFields,
      details: { accessed_fields: viewedFields }
    });
  }

  logMemberCreate(memberData: any) {
    this.log({
      action: 'create', 
      resource: 'member',
      target_name: memberData.name,
      page_path: '/member-management',
      page_name: '교인 등록',
      sensitive_data: Object.keys(memberData),
      details: { created_fields: Object.keys(memberData) }
    });
  }

  logMemberUpdate(memberId: number, memberName: string, updatedFields: string[]) {
    this.log({
      action: 'update',
      resource: 'member', 
      target_id: memberId,
      target_name: memberName,
      page_path: window.location.pathname,
      page_name: '교인 정보수정',
      sensitive_data: updatedFields,
      details: { updated_fields: updatedFields }
    });
  }

  logMemberDelete(memberId: number, memberName: string) {
    this.log({
      action: 'delete',
      resource: 'member',
      target_id: memberId, 
      target_name: memberName,
      page_path: window.location.pathname,
      page_name: '교인 삭제',
      details: { deleted_member: memberName }
    });
  }

  logMemberSearch(searchTerm: string, resultCount: number) {
    this.log({
      action: 'search',
      resource: 'member',
      page_path: '/member-management', 
      page_name: '교인 검색',
      details: { 
        search_term: searchTerm, 
        result_count: resultCount,
        searched_fields: ['name', 'phone', 'email'] 
      }
    });
  }

  logPageAccess(pagePath: string, pageName: string) {
    this.log({
      action: 'view',
      resource: 'system',
      page_path: pagePath,
      page_name: pageName,
      details: { page_accessed: pageName }
    });
  }

  // 출석 관련 로깅
  logAttendanceView(date: string, memberCount: number) {
    this.log({
      action: 'view',
      resource: 'attendance', 
      page_path: '/attendance',
      page_name: '출석 조회',
      details: { date, member_count: memberCount }
    });
  }

  // 재정 관련 로깅  
  logFinancialView(startDate: string, endDate: string, recordCount: number) {
    this.log({
      action: 'view',
      resource: 'financial',
      page_path: '/financial',
      page_name: '재정 조회', 
      details: { start_date: startDate, end_date: endDate, record_count: recordCount }
    });
  }

  // 로그인/로그아웃
  logLogin(loginMethod: string = 'password', additionalInfo?: any) {
    this.log({
      action: 'login',
      resource: 'system',
      page_path: '/login',
      page_name: '로그인',
      details: { 
        login_method: loginMethod,
        browser: this.getBrowserInfo(),
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        ...additionalInfo
      }
    });
  }

  logLogout() {
    this.log({
      action: 'logout', 
      resource: 'system',
      page_path: window.location.pathname,
      page_name: '로그아웃',
      details: {
        logout_time: new Date().toISOString(),
        session_duration: this.getSessionDuration()
      }
    });
  }

  logLoginFailure(email: string, reason: string) {
    this.log({
      action: 'login',
      resource: 'system',
      page_path: '/login',
      page_name: '로그인 실패',
      details: { 
        attempted_email: email,
        failure_reason: reason,
        browser: this.getBrowserInfo(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    });
  }

  // 유틸리티 메서드들
  private getCurrentUserId(): string | null {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || null;
    } catch {
      return null;
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = Date.now().toString() + Math.random().toString(36);
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  private async getClientIP(): Promise<string> {
    try {
      // 실제 구현에서는 백엔드에서 IP를 확인하는 것이 더 정확
      return '클라이언트에서 IP 확인 불가';
    } catch {
      return '알 수 없음';
    }
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getSessionDuration(): number {
    const sessionStart = sessionStorage.getItem('session_start_time');
    if (sessionStart) {
      return Date.now() - parseInt(sessionStart);
    }
    return 0;
  }

  private initializeSession(): void {
    if (!sessionStorage.getItem('session_start_time')) {
      sessionStorage.setItem('session_start_time', Date.now().toString());
    }
  }

  // 로그 큐 처리
  private async processQueue() {
    if (this.isLogging || this.logQueue.length === 0) return;
    
    this.isLogging = true;
    const logs = [...this.logQueue];
    this.logQueue = [];

    try {
      await api.post('/auth/activity-logs', { logs });
      console.log(`📋 ${logs.length}개의 활동 로그가 기록되었습니다`);
    } catch (error) {
      console.error('활동 로그 전송 실패:', error);
      // 실패한 로그는 다시 큐에 추가 (재시도)
      this.logQueue.unshift(...logs);
    } finally {
      this.isLogging = false;
    }
  }

  // 페이지 언로드 시 남은 로그 전송
  flushLogs() {
    if (this.logQueue.length > 0) {
      this.processQueue();
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const activityLogger = ActivityLogger.getInstance();

// 페이지 언로드 시 로그 flush
window.addEventListener('beforeunload', () => {
  activityLogger.flushLogs();
});