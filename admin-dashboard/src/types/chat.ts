export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  tokensUsed?: number;
  cost?: number;
  // 비서 에이전트 응답 관련 필드들
  is_secretary_agent?: boolean;
  query_type?: string;
  data_sources?: string[];
}

export interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
  isBookmarked: boolean;
}

export interface Agent {
  id: string | number;
  name: string;
  category: string;
  description: string;
  isActive: boolean;
  church_data_sources?: string[];
  system_prompt?: string;
  systemPrompt?: string;
}

export interface DeleteConfirmModal {
  isOpen: boolean;
  chatId: string | null;
  chatTitle: string;
}
