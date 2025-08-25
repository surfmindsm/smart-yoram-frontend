/**
 * AI 에이전트 관련 상수 정의
 */

// 공용 기본 에이전트 ID (모든 테넌트에서 사용 가능한 특별한 ID)
// 백엔드에서 0번 ID를 전역 기본 에이전트로 처리하도록 권장
export const DEFAULT_AGENT_ID = 0;

// 기본 에이전트 정보
export const DEFAULT_AGENT = {
  id: DEFAULT_AGENT_ID,
  name: '기본 AI 도우미',
  category: '일반',
  description: '모든 교회에서 사용 가능한 공통 AI 도우미입니다. 일반적인 질문과 교회 업무를 도와드립니다.',
  isActive: true
};

// 에이전트 관련 설정
export const AGENT_CONFIG = {
  // 새 대화 시작 시 사용할 기본 에이전트 ID
  DEFAULT_CHAT_AGENT_ID: DEFAULT_AGENT_ID,
  
  // 에이전트를 찾을 수 없을 때 사용할 폴백 에이전트 ID
  FALLBACK_AGENT_ID: DEFAULT_AGENT_ID,
  
  // 에이전트 선택이 없을 때 표시할 기본 제목
  DEFAULT_CHAT_TITLE: '새 대화'
};
