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
              onClick={() => navigate('/church-signup')}
              className="group inline-flex items-center gap-3 bg-white text-gray-900 px-10 py-5 text-lg font-medium hover:bg-gray-100 transition-all duration-300"
            >
              무료로 시작하기
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* 작은 정보 텍스트 */}
          <p className="text-sm text-white/70 font-light">
            신용카드 불필요 · 설치 즉시 사용 가능
          </p>
        </div>
      </div>

      {/* 하단 여백 */}
      <div className="h-20 relative z-20"></div>
    </section>
  );
}