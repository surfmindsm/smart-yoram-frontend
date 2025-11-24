import React from 'react';
import { Apple } from 'lucide-react';

export function AppDownloadSection() {
  return (
    <section id="app-download" className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-gray-300">
            교회 관리의 새로운 표준, Church Round를 무료로 경험해보세요
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* 앱 다운로드 버튼들 */}
          <div className="flex flex-col gap-4">
            {/* App Store 버튼 */}
            <a
              href="https://apps.apple.com/kr/app/your-app-id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 px-8 py-4 bg-white text-gray-900 rounded-2xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Apple className="w-8 h-8" />
              <div className="text-left">
                <div className="text-xs opacity-75">Download on the</div>
                <div className="text-lg font-semibold">App Store</div>
              </div>
            </a>

            {/* Google Play 버튼 */}
            <a
              href="https://play.google.com/store/apps/details?id=com.yourapp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 px-8 py-4 bg-white text-gray-900 rounded-2xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
              </svg>
              <div className="text-left">
                <div className="text-xs opacity-75">GET IT ON</div>
                <div className="text-lg font-semibold">Google Play</div>
              </div>
            </a>
          </div>

          {/* QR 코드 */}
          <div className="flex flex-col items-center gap-4">
            <div className="p-6 bg-white rounded-2xl shadow-2xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/download')}`}
                alt="QR Code"
                className="w-40 h-40"
              />
            </div>
            <p className="text-sm text-gray-300 font-medium">
              모바일에서 QR 코드를 스캔하세요
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
