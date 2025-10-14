import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../ui/button";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section id="hero" className="bg-background px-6 pt-32 pb-16">
      <div className="max-w-6xl mx-auto">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* 메인 타이틀 */}
          <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-foreground">
            교회 행정과 소통을 <span className="text-primary">한 번에</span>
          </h1>

          {/* 서브 문장 */}
          <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
            교인 관리부터 스마트 요람, 커뮤니티까지<br className="hidden sm:block" />
            완전 무료로 제공되는 통합 교회 관리 플랫폼
          </p>

          {/* CTA 버튼 */}
          <div className="pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/church-signup')}
              className="px-8 py-3 h-12 text-base"
            >
              무료로 시작하기
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}