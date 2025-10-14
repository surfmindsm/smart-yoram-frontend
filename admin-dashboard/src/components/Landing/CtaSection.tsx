import React from 'react';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {

  return (
    <section id="cta" className="py-20 px-6 bg-gradient-to-br from-primary to-green-500">
      <div className="max-w-6xl mx-auto text-center">
        {/* 메인 타이틀 */}
        <div className="mb-16">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6 leading-tight">
            전국 교회와 함께하는 스마트 요람 플랫폼
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Church Round는 이미 많은 교회들이 신뢰하고 사용하는 검증된 플랫폼입니다
          </p>
        </div>

        {/* 신뢰도 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl lg:text-5xl font-bold text-white mb-3">1,000+</div>
            <div className="text-blue-100 text-lg">전국 교회 도입</div>
            <div className="text-blue-200 text-sm mt-1">지속적인 성장</div>
          </div>
          <div className="text-center">
            <div className="text-4xl lg:text-5xl font-bold text-white mb-3">50,000+</div>
            <div className="text-blue-100 text-lg">교인 사용자</div>
            <div className="text-blue-200 text-sm mt-1">활발한 참여</div>
          </div>
          <div className="text-center">
            <div className="text-4xl lg:text-5xl font-bold text-white mb-3">99.9%</div>
            <div className="text-blue-100 text-lg">서비스 안정성</div>
            <div className="text-blue-200 text-sm mt-1">안전한 운영</div>
          </div>
        </div>

        {/* 서비스 혜택 */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 mb-12">
          <h3 className="text-xl font-semibold text-white mb-6">
            💙 Church Round와 함께하는 교회들의 특별한 혜택
          </h3>
          <div className="grid md:grid-cols-2 gap-6 text-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-left">
                <p className="text-white font-semibold mb-1">완전 무료 서비스</p>
                <p className="text-sm text-blue-200">교회 규모나 교인 수 제한 없음</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-left">
                <p className="text-white font-semibold mb-1">전담 매니저 지원</p>
                <p className="text-sm text-blue-200">도입부터 운영까지 1:1 관리</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-left">
                <p className="text-white font-semibold mb-1">안전한 데이터 이전</p>
                <p className="text-sm text-blue-200">기존 교적부 100% 무손실 이전</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div className="text-left">
                <p className="text-white font-semibold mb-1">24시간 기술지원</p>
                <p className="text-sm text-blue-200">언제든지 도움이 필요할 때</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 버튼 */}
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={() => {
              const element = document.getElementById('features');
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white text-primary hover:bg-gray-100 px-12 py-4 h-14 text-lg shadow-lg"
          >
            서비스 둘러보기
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
