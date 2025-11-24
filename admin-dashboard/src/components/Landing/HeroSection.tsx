import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui/button";
import { Apple } from 'lucide-react';

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

      <div className="relative z-20 max-w-7xl mx-auto px-6 pt-40 pb-32">
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
          <p className="text-xl lg:text-2xl text-white/90 font-light leading-relaxed max-w-3xl">
            교인 관리부터 스마트 요람, 커뮤니티까지<br />
            완전 무료로 제공되는 통합 교회 관리 플랫폼
          </p>

          {/* 심플한 CTA */}
          <div className="pt-8">
            <button
              onClick={() => navigate('/login')}
              className="group inline-flex items-center gap-3 bg-white text-gray-900 px-10 py-5 text-lg font-medium hover:bg-gray-100 transition-all duration-300"
            >
              무료로 시작하기
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* 앱 다운로드 섹션 */}
          <div className="pt-12">
            <p className="text-sm text-white/90 font-medium mb-6">모바일 앱 다운로드</p>

            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* 다운로드 버튼들 */}
              <div className="flex flex-col gap-3">
                {/* App Store 버튼 */}
                <a
                  href="https://apps.apple.com/kr/app/your-app-id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Apple className="w-5 h-5" />
                  <div className="text-left">
                    <div className="text-xs opacity-75">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </a>

                {/* Google Play 버튼 */}
                <a
                  href="https://play.google.com/store/apps/details?id=com.yourapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs opacity-75">GET IT ON</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </a>
              </div>

              {/* QR 코드 - 데스크톱에서만 표시 */}
              <div className="hidden sm:flex flex-col items-center px-6 py-4 bg-white rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/download')}`}
                  alt="QR Code"
                  className="w-32 h-32"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-20 relative z-20"></div>
    </section>
  );
}