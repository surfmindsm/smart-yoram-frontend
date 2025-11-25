import React, { useEffect, useState } from 'react';
import { detectDevice, APP_STORE_LINKS } from '../utils/appDownload';
import { Smartphone, Apple, Download } from 'lucide-react';

export default function DownloadRedirect() {
  const [device, setDevice] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const detectedDevice = detectDevice();
    setDevice(detectedDevice);

    // 데스크톱이면 churchround.com으로 리다이렉트
    if (detectedDevice === 'desktop') {
      window.location.href = 'https://churchround.com';
      return;
    }

    // 모바일이면 자동으로 앱스토어로 리다이렉트
    if (detectedDevice === 'ios' || detectedDevice === 'android') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // 리다이렉트 실행
            window.location.href = APP_STORE_LINKS[detectedDevice];
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, []);

  const handleManualDownload = () => {
    if (device === 'ios') {
      window.location.href = APP_STORE_LINKS.ios;
    } else if (device === 'android') {
      window.location.href = APP_STORE_LINKS.android;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        {/* 아이콘 */}
        <div className="text-center">
          {device === 'ios' && (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-2xl mb-4">
              <Apple className="w-12 h-12 text-white" />
            </div>
          )}
          {device === 'android' && (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-2xl mb-4">
              <Smartphone className="w-12 h-12 text-white" />
            </div>
          )}
          {device === 'desktop' && (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-2xl mb-4">
              <Download className="w-12 h-12 text-gray-600" />
            </div>
          )}
        </div>

        {/* 메시지 */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Church Round</h1>
          <p className="text-gray-600">
            {device === 'ios' && 'App Store로 이동합니다...'}
            {device === 'android' && 'Google Play로 이동합니다...'}
            {device === 'desktop' && '모바일 기기에서 접속해주세요'}
          </p>
        </div>

        {/* 카운트다운 또는 안내 */}
        {(device === 'ios' || device === 'android') ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                <span className="text-3xl font-bold text-blue-600">{countdown}</span>
              </div>
            </div>

            <button
              onClick={handleManualDownload}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              바로 이동하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 text-center">
                이 링크는 모바일 기기에서만 작동합니다.<br />
                휴대폰으로 QR 코드를 스캔해주세요.
              </p>
            </div>

            <div className="space-y-3">
              <a
                href={APP_STORE_LINKS.ios}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Apple className="w-5 h-5" />
                <span className="font-medium">App Store</span>
              </a>

              <a
                href={APP_STORE_LINKS.android}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                </svg>
                <span className="font-medium">Google Play</span>
              </a>
            </div>
          </div>
        )}

        {/* 하단 텍스트 */}
        <p className="text-xs text-center text-gray-400 pt-4">
          교회 관리를 위한 올인원 플랫폼
        </p>
      </div>
    </div>
  );
}
