import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui/button";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section id="hero" className="relative bg-white overflow-hidden">
      {/* 배경 이미지 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-10"></div>
        <img
          src="/wall_1.png"
          alt="Church Background"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 pt-24 md:pt-32 lg:pt-40 pb-12 md:pb-16">
        {/* Big Typo 레이아웃 */}
        <div className="space-y-8 md:space-y-12 max-w-4xl">
          {/* 메인 타이틀 - 매우 큰 타이포그래피 */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] text-white tracking-tight">
            교회 행정과<br />
            소통을 한 번에
          </h1>

          {/* 얇은 구분선 */}
          <div className="w-16 md:w-24 h-px bg-white/50"></div>

          {/* 서브 문구 - 큰 타이포그래피 */}
          <p className="text-base md:text-lg lg:text-2xl text-white/80 font-regular leading-relaxed max-w-3xl">
            교인 관리부터 스마트 요람, 커뮤니티까지<br />
            완전 무료로 제공되는 통합 교회 관리 플랫폼
          </p>

          {/* 심플한 CTA */}
          <div className="pt-1">
            <button
              onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-2 md:gap-3 bg-white text-gray-900 px-6 py-3 md:px-10 md:py-5 text-base md:text-lg font-medium rounded-2xl hover:bg-gray-100 transition-all duration-300"
            >
              교회 관리자로 시작하기
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* 앱 다운로드 섹션 */}
          <div className="pt-2">
            <p className="text-lg md:text-xl text-white/80 font-medium mb-4 md:mb-6">교인용 앱 다운로드</p>

            <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
              {/* 다운로드 버튼들 */}
              <div className="flex flex-col gap-3 md:gap-4 w-full sm:w-auto max-w-xs">
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

              {/* QR 코드 - 데스크톱에서만 표시 */}
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
        </div>
      </div>
    </section>
  );
}