/// <reference types="react-scripts" />

// 전역 인터페이스 확장
declare global {
  interface Window {
    chatLoadInitialized?: boolean;
    debugChatStorage?: {
      getAllChatKeys(): string[];
      showAllChatData(): void;
      clearAllChatData(): void;
      removeSpecificChat(chatId: string): void;
    };
    apiCache?: {
      get<T>(url: string, params?: any): T | null;
      set<T>(url: string, data: T, params?: any): void;
      invalidate(pattern: string): void;
      clear(): void;
      getStats(): { cacheSize: number; pendingRequests: number };
    };
  }
}

// 모듈로 내보내기 (TypeScript가 이 파일을 모듈로 인식하도록)
export {};
