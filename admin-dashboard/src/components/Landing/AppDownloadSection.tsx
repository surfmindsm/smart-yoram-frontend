import React from 'react';
import { useNavigate } from 'react-router-dom';

export function AppDownloadSection() {
  const navigate = useNavigate();

  return (
    <section id="app-download" className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-16 md:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-6 md:mb-8 px-4">
            교회 관리의 새로운 표준, Church Round를 평생 무료로 사용하세요
          </p>

          {/* 교회 관리자 시작하기 버튼 */}
          <div className="mb-8 md:mb-12">
            <button
              onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-2 md:gap-3 bg-white text-gray-900 px-6 py-3 md:px-10 md:py-5 text-base md:text-lg font-medium rounded-2xl hover:bg-gray-100 transition-all duration-300"
            >
              교회 관리자로 시작하기
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        <p className="text-xs md:text-sm text-gray-400 text-center mb-4 md:mb-6">
          * 현재 앱은 교인용만 제공됩니다
        </p>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-6 md:gap-8 lg:gap-12">
          {/* 앱 다운로드 버튼들 */}
          <div className="flex flex-col gap-3 md:gap-4 w-full max-w-xs">
            {/* App Store 버튼 */}
            <a
              href="https://apps.apple.com/app/id6749299505"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 md:gap-4 px-6 md:px-8 py-3 md:py-4 bg-white text-gray-900 rounded-2xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <img src="/apple_black.png" alt="Apple" className="w-6 md:w-8 h-6 md:h-8 flex-shrink-0" />
              <div className="text-left">
                <div className="text-[10px] md:text-xs opacity-75">Download on the</div>
                <div className="text-base md:text-lg font-semibold">App Store</div>
              </div>
            </a>

            {/* Google Play 버튼 */}
            <a
              href="https://play.google.com/store/apps/details?id=com.surfmind.yoram"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 md:gap-4 px-6 md:px-8 py-3 md:py-4 bg-white text-gray-900 rounded-2xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <img src="/google_black.png" alt="Google Play" className="w-6 md:w-8 h-6 md:h-8 flex-shrink-0" />
              <div className="text-left">
                <div className="text-[10px] md:text-xs opacity-75">GET IT ON</div>
                <div className="text-base md:text-lg font-semibold">Google Play</div>
              </div>
            </a>
          </div>

          {/* QR 코드 */}
          <div className="hidden md:flex items-center justify-center">
            <div className="p-3 bg-white rounded-2xl shadow-2xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  (process.env.REACT_APP_PRODUCTION_URL || window.location.origin) + '/download'
                )}`}
                alt="QR Code"
                className="w-[140px] h-[140px] md:w-[168px] md:h-[168px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
