import React from 'react';
import { useNavigate } from 'react-router-dom';

export function AppDownloadSection() {
  const navigate = useNavigate();

  return (
    <section id="app-download" className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            교회 관리의 새로운 표준, Church Round를 평생 무료로 사용하세요
          </p>

          {/* 교회 관리자 시작하기 버튼 */}
          <div className="mb-12">
            <button
              onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-3 bg-white text-gray-900 px-10 py-5 text-lg font-medium rounded-2xl hover:bg-gray-100 transition-all duration-300"
            >
              교회 관리자로 시작하기
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-400 text-center mb-6">
          * 현재 앱은 교인용만 제공됩니다
        </p>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
          {/* 앱 다운로드 버튼들 */}
          <div className="flex flex-col gap-4 w-64">
            {/* App Store 버튼 */}
            <a
              href="https://apps.apple.com/app/id6749299505"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-8 py-4 bg-white text-gray-900 rounded-2xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <img src="/apple_black.png" alt="Apple" className="w-8 h-8 flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs opacity-75">Download on the</div>
                <div className="text-lg font-semibold">App Store</div>
              </div>
            </a>

            {/* Google Play 버튼 */}
            <a
              href="https://play.google.com/store/apps/details?id=com.surfmind.yoram"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 px-8 py-4 bg-white text-gray-900 rounded-2xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <img src="/google_black.png" alt="Google Play" className="w-8 h-8 flex-shrink-0" />
              <div className="text-left">
                <div className="text-xs opacity-75">GET IT ON</div>
                <div className="text-lg font-semibold">Google Play</div>
              </div>
            </a>
          </div>

          {/* QR 코드 */}
          <div className="flex items-center justify-center">
            <div className="p-3 bg-white rounded-2xl shadow-2xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  (process.env.REACT_APP_PRODUCTION_URL || window.location.origin) + '/download'
                )}`}
                alt="QR Code"
                className="w-[168px] h-[168px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
