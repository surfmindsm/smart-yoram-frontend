import React from 'react';

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {/* 섹션 타이틀 */}
        <div className="text-center mb-16">
          <h2 className="text-2xl lg:text-3xl font-bold mb-4 text-foreground leading-tight">
            Church Round <span className="text-primary">핵심 기능</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            교회 행정부터 교인 소통까지 한 번에 해결하세요
          </p>
        </div>

        {/* 4개 핵심 기능 카드 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 카드 1: 교적 관리 */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">교적 관리</h3>
            <p className="text-muted-foreground text-sm">교인·가정·부서 통합 관리</p>
          </div>

          {/* 카드 2: 스마트 요람 */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl">📰</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">스마트 요람</h3>
            <p className="text-muted-foreground text-sm">교인 명단을 앱으로 확인</p>
          </div>

          {/* 카드 3: 교회 소식 */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">교회 소식</h3>
            <p className="text-muted-foreground text-sm">주보·행사를 실시간 전달</p>
          </div>

          {/* 카드 4: 커뮤니티 */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-xl">🛍️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">커뮤니티</h3>
            <p className="text-muted-foreground text-sm">교인 간 거래·구인구직</p>
          </div>
        </div>
      </div>
    </section>
  );
}