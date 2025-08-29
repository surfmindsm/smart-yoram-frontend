// 채팅 관련 에러 처리 유틸리티

export interface ChatErrorHandlerOptions {
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  setMessages: (messages: any[]) => void;
  setSelectedAgentForChat: (agent: any) => void;
  setChatHistory: (updater: (prev: any[]) => any[]) => void;
  setMessageCache: (updater: (prev: any) => any) => void;
}

export class ChatErrorHandler {
  private options: ChatErrorHandlerOptions;

  constructor(options: ChatErrorHandlerOptions) {
    this.options = options;
  }

  handleMessageLoadError(error: any): boolean {
    const { currentChatId } = this.options;
    
    if (!currentChatId) return false;

    // 404 에러: 존재하지 않는 채팅 히스토리
    if (error?.response?.status === 404 || error?.message?.includes('CHAT_HISTORY_NOT_FOUND')) {
      console.warn('🧹 존재하지 않는 채팅 ID 정리:', currentChatId);
      this.cleanupInvalidChat(currentChatId);
      return true;
    }

    // 500 에러: 서버 내부 오류
    if (error?.response?.status === 500 || error?.message?.includes('SERVER_ERROR')) {
      console.error('⚠️ 서버 에러로 인한 메시지 로딩 실패');
      this.handleServerError();
      return true;
    }

    // 네트워크 에러
    if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
      console.error('🌐 네트워크 연결 에러');
      this.handleNetworkError();
      return true;
    }

    return false;
  }

  private cleanupInvalidChat(chatId: string) {
    const {
      setCurrentChatId,
      setMessages,
      setSelectedAgentForChat,
      setChatHistory,
      setMessageCache
    } = this.options;

    // 현재 상태 초기화
    setCurrentChatId(null);
    setMessages([]);
    setSelectedAgentForChat(null);

    // 히스토리에서 제거
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));

    // 캐시에서 제거
    setMessageCache(prev => {
      const newCache = { ...prev };
      delete newCache[chatId];
      return newCache;
    });

    // 로컬 스토리지에서도 제거
    try {
      localStorage.removeItem(`chat_messages_${chatId}`);
      console.log('📦 로컬 스토리지에서 잘못된 채팅 데이터 제거 완료');
    } catch (e) {
      console.warn('로컬 스토리지 정리 중 에러:', e);
    }
  }

  private handleServerError() {
    // 서버 에러의 경우 현재 상태 유지하고 사용자에게 알림
    console.log('🔄 서버 복구를 기다리는 중...');
  }

  private handleNetworkError() {
    // 네트워크 에러의 경우 오프라인 모드로 전환
    console.log('📱 오프라인 모드로 전환');
  }

  // 채팅 히스토리 정리 (유효하지 않은 항목들 제거)
  static cleanupChatHistory(chatHistory: any[]): any[] {
    return chatHistory.filter(chat => {
      // 기본 검증
      if (!chat.id || !chat.title) return false;
      
      // ID 형식 검증 (chat_숫자 또는 temp_숫자)
      const isValidId = /^(chat_\d+|temp_\d+)$/.test(chat.id);
      if (!isValidId) return false;

      return true;
    });
  }
}