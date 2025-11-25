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

      <div className="relative z-20 max-w-7xl mx-auto px-6 pt-40 pb-16">
        {/* Big Typo 레이아웃 */}
        <div className="space-y-12 max-w-4xl">
          {/* 메인 타이틀 - 매우 큰 타이포그래피 */}
          <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] text-white tracking-tight">
            교회 행정과<br />
            소통을 한 번에
          </h1>

          {/* 얇은 구분선 */}
          <div className="w-24 h-px bg-white/50"></div>

          {/* 서브 문구 - 큰 타이포그래피 */}
          <p className="text-xl lg:text-2xl text-white/80 font-regular leading-relaxed max-w-3xl">
            교인 관리부터 스마트 요람, 커뮤니티까지<br />
            완전 무료로 제공되는 통합 교회 관리 플랫폼
          </p>

          {/* 심플한 CTA */}
          <div className="pt-1">
            <button
              onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-3 bg-white text-gray-900 px-10 py-5 text-lg font-medium rounded-2xl hover:bg-gray-100 transition-all duration-300"
            >
              교회 관리자로 시작하기
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* 앱 다운로드 섹션 */}
          <div className="pt-2">
            <p className="text-xl text-white/80 font-medium mb-6">교인용 앱 다운로드</p>

            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* 다운로드 버튼들 */}
              <div className="flex flex-col gap-3">
                {/* App Store 버튼 */}
                <a
                  href="https://apps.apple.com/app/id6749299505"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  <img src="/apple_black.png" alt="Apple" className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-xs opacity-75">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </a>

                {/* Google Play 버튼 */}
                <a
                  href="https://play.google.com/store/apps/details?id=com.surfmind.yoram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-2xl hover:bg-gray-100 transition-colors"
                >
                  <img src="/google_black.png" alt="Google Play" className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-xs opacity-75">GET IT ON</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </a>
              </div>

              {/* QR 코드 - 데스크톱에서만 표시 */}
              <div className="hidden sm:flex flex-col items-center px-4 py-4 bg-white rounded-2xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                    (process.env.REACT_APP_PRODUCTION_URL || window.location.origin) + '/download'
                  )}`}
                  alt="QR Code"
                  className="w-24 h-24"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}