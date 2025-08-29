// API 응답 캐싱 및 중복 요청 방지 유틸리티

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class APICache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  
  // 캐시 만료 시간 (밀리초)
  private defaultTTL = 5 * 60 * 1000; // 5분
  private shortTTL = 30 * 1000; // 30초
  private longTTL = 30 * 60 * 1000; // 30분

  // 캐시 키 생성
  private getCacheKey(url: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${url}${paramStr}`;
  }

  // TTL 결정 (엔드포인트별 최적화)
  private getTTL(url: string): number {
    if (url.includes('/agents')) return this.longTTL; // 에이전트는 자주 변경되지 않음
    if (url.includes('/histories')) return this.defaultTTL; // 채팅 히스토리
    if (url.includes('/messages')) return this.shortTTL; // 메시지는 자주 변경됨
    return this.defaultTTL;
  }

  // 캐시에서 데이터 가져오기
  get<T>(url: string, params?: any): T | null {
    const key = this.getCacheKey(url, params);
    const item = this.cache.get(key);
    
    if (item && Date.now() < item.expiry) {
      console.log('🚀 캐시에서 데이터 반환:', url);
      return item.data;
    }
    
    if (item) {
      this.cache.delete(key); // 만료된 캐시 삭제
    }
    
    return null;
  }

  // 캐시에 데이터 저장
  set<T>(url: string, data: T, params?: any): void {
    const key = this.getCacheKey(url, params);
    const ttl = this.getTTL(url);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    });
    
    console.log('💾 데이터 캐시 저장:', url, `(TTL: ${ttl/1000}초)`);
  }

  // 중복 요청 방지
  async dedupe<T>(
    key: string, 
    requestFn: () => Promise<T>
  ): Promise<T> {
    // 이미 진행 중인 같은 요청이 있는지 확인
    const pending = this.pendingRequests.get(key);
    
    if (pending) {
      console.log('🔄 중복 요청 방지, 기존 요청 재사용:', key);
      return pending.promise;
    }

    // 새 요청 시작
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key); // 완료 후 정리
    });
    
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });
    
    return promise;
  }

  // 특정 패턴의 캐시 무효화
  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
    });
    
    console.log('🗑️ 캐시 무효화:', pattern, `(${keysToDelete.length}개 항목)`);
  }

  // 전체 캐시 초기화
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
    console.log('🧹 전체 캐시 초기화');
  }

  // 만료된 캐시 정리
  cleanup(): void {
    const now = Date.now();
    const deletedKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now >= item.expiry) {
        this.cache.delete(key);
        deletedKeys.push(key);
      }
    });
    
    // 오래된 진행 중인 요청도 정리 (5분 이상)
    this.pendingRequests.forEach((request, key) => {
      if (now - request.timestamp > 5 * 60 * 1000) {
        this.pendingRequests.delete(key);
        deletedKeys.push(key);
      }
    });
    
    if (deletedKeys.length > 0) {
      console.log('🧽 만료된 캐시 정리:', deletedKeys.length, '개');
    }
  }

  // 캐시 통계
  getStats(): {
    cacheSize: number;
    pendingRequests: number;
    hitRate?: number;
  } {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size
    };
  }
}

// 싱글톤 인스턴스
export const apiCache = new APICache();

// 주기적으로 만료된 캐시 정리 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
}

// 개발 환경에서 전역 접근 가능하도록
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).apiCache = apiCache;
}