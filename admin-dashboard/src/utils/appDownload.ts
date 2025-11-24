// 앱 스토어 링크
export const APP_STORE_LINKS = {
  ios: 'https://apps.apple.com/app/id6749299505',
  android: 'https://play.google.com/store/apps/details?id=com.surfmind.yoram',
};

// 디바이스 타입 감지
export function detectDevice(): 'ios' | 'android' | 'desktop' {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // iOS 감지
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }

  // Android 감지
  if (/android/i.test(userAgent)) {
    return 'android';
  }

  // 그 외는 데스크톱
  return 'desktop';
}

// 앱 다운로드 리다이렉트
export function redirectToAppStore() {
  const device = detectDevice();

  switch (device) {
    case 'ios':
      window.location.href = APP_STORE_LINKS.ios;
      break;
    case 'android':
      window.location.href = APP_STORE_LINKS.android;
      break;
    case 'desktop':
      // 데스크톱에서는 모달을 띄우거나 QR 코드를 보여줄 수 있음
      return { showModal: true, device };
  }

  return { showModal: false, device };
}

// 다이나믹 링크 생성 (Firebase Dynamic Links나 Branch.io 사용 시)
export function createDynamicLink(
  campaignId?: string,
  fallbackUrl?: string
): string {
  const baseUrl = window.location.origin;
  const device = detectDevice();

  // 쿼리 파라미터로 캠페인 정보 추가 가능
  const params = new URLSearchParams();
  if (campaignId) params.append('campaign', campaignId);
  if (fallbackUrl) params.append('fallback', fallbackUrl);

  const queryString = params.toString();
  const link = queryString ? `${baseUrl}/download?${queryString}` : `${baseUrl}/download`;

  return link;
}

// 앱 설치 여부 확인 (Deep Link 시도)
export function tryDeepLink(deepLinkUrl: string, fallbackFn: () => void) {
  const timeout = 2000; // 2초 대기
  let isAppOpened = false;

  // 앱이 열리면 페이지가 백그라운드로 가므로 visibilitychange 이벤트 감지
  const handleVisibilityChange = () => {
    if (document.hidden) {
      isAppOpened = true;
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Deep Link 시도
  window.location.href = deepLinkUrl;

  // 일정 시간 후 앱이 열리지 않았다면 fallback 실행
  setTimeout(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (!isAppOpened) {
      fallbackFn();
    }
  }, timeout);
}
