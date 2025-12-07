/**
 * 문의하기/버그 리포트 API 서비스
 */

import { supabaseAuthService } from '../services/supabaseAuthService';
import { CreateBugReportRequest, BugReport } from '../types/bug-reports';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const bugReportAPI = {
  /**
   * 문의하기 제출
   */
  create: async (data: CreateBugReportRequest): Promise<BugReport> => {
    try {
      const token = await supabaseAuthService.getToken();
      if (!token) {
        throw new Error('인증 토큰이 없습니다');
      }

      // 현재 사용자 정보 가져오기
      const userResult = await supabaseAuthService.getCurrentUser();
      if (!userResult?.user) {
        throw new Error('사용자 정보를 찾을 수 없습니다');
      }

      const { user } = userResult;

      // 브라우저 정보 수집
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;

      // 간단한 OS 버전 감지
      let osVersion = 'Unknown';
      if (userAgent.includes('Windows')) {
        osVersion = 'Windows';
      } else if (userAgent.includes('Mac')) {
        osVersion = 'macOS';
      } else if (userAgent.includes('Linux')) {
        osVersion = 'Linux';
      }

      // 문의 데이터 구성
      const bugReportData = {
        user_id: user.id,
        church_id: user.church_id || 9998,
        issue_type: data.issue_type,
        description: data.description,
        app_version: data.app_version || 'web-admin-v1.0',
        platform: data.platform || platform,
        os_version: data.os_version || osVersion,
        device_model: data.device_model || 'Web Browser',
        status: 'pending'
      };

      // Supabase Direct Insert
      const response = await fetch(`${SUPABASE_URL}/rest/v1/bug_reports`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(bugReportData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('문의하기 제출 실패:', errorText);
        throw new Error('문의하기 제출에 실패했습니다');
      }

      const result = await response.json();
      return Array.isArray(result) ? result[0] : result;
    } catch (error) {
      console.error('문의하기 API 오류:', error);
      throw error;
    }
  }
};
