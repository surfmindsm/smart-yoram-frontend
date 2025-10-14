import React from 'react';

export function ProcessSection() {

  const steps = [
    {
      number: "①",
      title: "도입 상담 신청",
      description: "간단한 교회 정보 입력 후 전담 매니저 배정",
      icon: "💬",
      bgColor: "bg-blue-50"
    },
    {
      number: "②",
      title: "관리자 계정 개설",
      description: "교회 관리자용 계정 발급 및 초기 세팅 지원",
      icon: "🧭",
      bgColor: "bg-green-50"
    },
    {
      number: "③",
      title: "데이터 이전 지원",
      description: "기존 교적부 데이터 안전하게 이전",
      icon: "🔄",
      bgColor: "bg-pink-50"
    },
    {
      number: "④",
      title: "서비스 시작",
      description: "교적·요람·커뮤니티 즉시 사용 가능",
      icon: "🚀",
      bgColor: "bg-blue-50"
    }
  ];

  return (
    <section id="process" className="py-16 px-6 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* 섹션 타이틀 */}
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold mb-3 text-foreground">
            간단한 도입 절차
          </h2>
          <p className="text-base text-muted-foreground">
            평균 1-2주 내 모든 설정 완료
          </p>
        </div>

        {/* 4단계 도입 절차 - 간소화 */}
        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{step.icon}</span>
              </div>
              <h4 className="text-base font-semibold text-foreground mb-2">
                {step.title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
