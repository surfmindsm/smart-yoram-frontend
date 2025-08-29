// 채팅 관련 로컬 스토리지 관리 유틸리티

export class ChatStorageUtils {
  // 모든 채팅 관련 로컬스토리지 데이터 조회
  static getAllChatData(): {
    currentChatId: string | null;
    chatHistory: any[];
    messageCache: any;
  } {
    try {
      const currentChatId = localStorage.getItem('current_chat_id');
      const chatHistoryStr = localStorage.getItem('chat_history');
      const messageCacheStr = localStorage.getItem('message_cache');

      return {
        currentChatId: currentChatId,
        chatHistory: chatHistoryStr ? JSON.parse(chatHistoryStr) : [],
        messageCache: messageCacheStr ? JSON.parse(messageCacheStr) : {}
      };
    } catch (error) {
      console.error('로컬스토리지 데이터 조회 실패:', error);
      return {
        currentChatId: null,
        chatHistory: [],
        messageCache: {}
      };
    }
  }

  // 특정 채팅 ID와 관련된 모든 데이터 삭제
  static removeChat(chatId: string) {
    console.log('🗑️ 채팅 데이터 삭제:', chatId);

    // 1. 메시지 캐시에서 제거
    try {
      const messageCacheStr = localStorage.getItem('message_cache');
      if (messageCacheStr) {
        const messageCache = JSON.parse(messageCacheStr);
        delete messageCache[chatId];
        localStorage.setItem('message_cache', JSON.stringify(messageCache));
      }
    } catch (e) {
      console.warn('메시지 캐시 정리 실패:', e);
    }

    // 2. 채팅 히스토리에서 제거
    try {
      const chatHistoryStr = localStorage.getItem('chat_history');
      if (chatHistoryStr) {
        const chatHistory = JSON.parse(chatHistoryStr);
        const filteredHistory = chatHistory.filter((chat: any) => chat.id !== chatId);
        localStorage.setItem('chat_history', JSON.stringify(filteredHistory));
      }
    } catch (e) {
      console.warn('채팅 히스토리 정리 실패:', e);
    }

    // 3. 개별 메시지 저장소에서 제거
    try {
      localStorage.removeItem(`chat_messages_${chatId}`);
    } catch (e) {
      console.warn('개별 메시지 정리 실패:', e);
    }

    // 4. 현재 채팅이 삭제된 채팅과 같다면 null로 설정
    try {
      const currentChatId = localStorage.getItem('current_chat_id');
      if (currentChatId === chatId) {
        localStorage.removeItem('current_chat_id');
      }
    } catch (e) {
      console.warn('현재 채팅 ID 정리 실패:', e);
    }
  }

  // 잘못된 채팅 데이터 일괄 정리
  static cleanupInvalidChats(): {
    removed: string[];
    remaining: string[];
  } {
    const removed: string[] = [];
    const remaining: string[] = [];

    try {
      const data = this.getAllChatData();

      // 유효하지 않은 채팅 ID 패턴 찾기
      data.chatHistory.forEach((chat: any) => {
        if (!chat.id || !chat.title || !this.isValidChatId(chat.id)) {
          removed.push(chat.id || 'unknown');
          this.removeChat(chat.id);
        } else {
          remaining.push(chat.id);
        }
      });

      // 메시지 캐시에서도 정리
      Object.keys(data.messageCache).forEach(chatId => {
        if (!this.isValidChatId(chatId)) {
          removed.push(chatId);
          this.removeChat(chatId);
        }
      });

      console.log('🧹 채팅 데이터 정리 완료:', { removed, remaining });
      return { removed, remaining };
    } catch (error) {
      console.error('채팅 데이터 정리 실패:', error);
      return { removed: [], remaining: [] };
    }
  }

  // 채팅 ID 유효성 검증
  static isValidChatId(chatId: string): boolean {
    if (!chatId || typeof chatId !== 'string') return false;
    
    // 허용되는 패턴: chat_숫자, temp_숫자
    return /^(chat_\d+|temp_\d+)$/.test(chatId);
  }

  // 전체 채팅 데이터 초기화 (긴급 상황용)
  static resetAllChatData() {
    console.warn('🚨 모든 채팅 데이터 초기화');
    
    const keysToRemove = [
      'current_chat_id',
      'chat_history', 
      'message_cache'
    ];

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`${key} 제거 실패:`, e);
      }
    });

    // chat_messages_* 패턴의 키들도 모두 제거
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chat_messages_')) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('메시지 캐시 전체 정리 실패:', e);
    }
  }
}