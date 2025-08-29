// 개발자도구에서 사용할 수 있는 채팅 스토리지 디버깅 유틸리티

export const debugChatStorage = {
  // 모든 채팅 관련 로컬스토리지 키 조회
  getAllChatKeys(): string[] {
    const chatKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('chat') || 
        key.includes('message') || 
        key.includes('history')
      )) {
        chatKeys.push(key);
      }
    }
    return chatKeys;
  },

  // 모든 채팅 관련 데이터 출력
  showAllChatData(): void {
    console.log('=== 채팅 관련 로컬스토리지 데이터 ===');
    
    const chatKeys = this.getAllChatKeys();
    chatKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        console.log(`${key}:`, value ? JSON.parse(value) : value);
      } catch (e) {
        console.log(`${key}:`, localStorage.getItem(key));
      }
    });
  },

  // 모든 채팅 관련 데이터 삭제
  clearAllChatData(): void {
    console.log('🗑️ 모든 채팅 관련 데이터 삭제');
    
    const chatKeys = this.getAllChatKeys();
    chatKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`삭제: ${key}`);
    });
    
    console.log('✅ 채팅 데이터 삭제 완료. 페이지를 새로고침하세요.');
  },

  // 특정 채팅 ID 관련 데이터만 삭제
  removeSpecificChat(chatId: string): void {
    console.log(`🗑️ 채팅 ${chatId} 관련 데이터 삭제`);
    
    const keysToCheck = [
      `chat_messages_${chatId}`,
      'current_chat_id',
      'chat_history',
      'message_cache'
    ];

    keysToCheck.forEach(key => {
      if (key === 'current_chat_id') {
        const current = localStorage.getItem(key);
        if (current === chatId) {
          localStorage.removeItem(key);
          console.log(`삭제: ${key} (${current})`);
        }
      } else if (key === 'chat_history') {
        try {
          const history = localStorage.getItem(key);
          if (history) {
            const parsed = JSON.parse(history);
            const filtered = parsed.filter((chat: any) => chat.id !== chatId);
            localStorage.setItem(key, JSON.stringify(filtered));
            console.log(`업데이트: ${key}`);
          }
        } catch (e) {
          console.warn(`${key} 처리 실패:`, e);
        }
      } else if (key === 'message_cache') {
        try {
          const cache = localStorage.getItem(key);
          if (cache) {
            const parsed = JSON.parse(cache);
            delete parsed[chatId];
            localStorage.setItem(key, JSON.stringify(parsed));
            console.log(`업데이트: ${key}`);
          }
        } catch (e) {
          console.warn(`${key} 처리 실패:`, e);
        }
      } else {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          console.log(`삭제: ${key}`);
        }
      }
    });
  }
};

// 전역에서 사용할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  (window as any).debugChatStorage = debugChatStorage;
}

// ESM 모듈 표시
export default debugChatStorage;