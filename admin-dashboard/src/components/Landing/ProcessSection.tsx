import React from 'react';
import { MessageCircle, KeyRound, Rocket } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export function ProcessSection() {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const steps = [
    {
      Icon: MessageCircle,
      step: 'STEP 01',
      title: '도입 상담 신청',
      desc: '간단한 교회 정보 입력 후 전담 매니저가 배정됩니다.',
    },
    {
      Icon: KeyRound,
      step: 'STEP 02',
      title: '관리자 계정 개설',
      desc: '교회 관리자용 계정 발급 및 초기 세팅을 지원합니다.',
    },
    {
      Icon: Rocket,
      step: 'STEP 03',
      title: '서비스 시작',
      desc: '교적·요람·커뮤니티를 즉시 사용할 수 있습니다.',
    },
  ];

  return (
    <section
      id="process"
      ref={sectionRef}
      className="mx-auto max-w-[1040px] px-6 py-20 md:py-[80px]"
    >
      <div
        className={`text-center transition-all duration-700 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#0E1729] md:text-[30px]">
          도입 절차
        </h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-[#64748B] md:text-[15px]">
          평균 1–2시간 내에 모든 설정이 완료됩니다.
        </p>
      </div>

      <div className="mt-11 grid grid-cols-1 gap-[18px] md:grid-cols-3 md:gap-[22px]">
        {steps.map(({ Icon, step, title, desc }, i) => (
          <div
            key={title}
            className={`rounded-[16px] border border-[#EEF1F6] bg-white p-[26px] transition-all duration-700 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
            style={{ transitionDelay: `${i * 80 + 200}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#EAF1FE] text-primary">
                <Icon className="h-[23px] w-[23px]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#94A3B8]">
                {step}
              </span>
            </div>
            <div className="mt-4 text-[18px] font-bold tracking-[-0.01em] text-[#0E1729]">
              {title}
            </div>
            <p className="mt-2.5 text-[13.5px] leading-[1.65] text-[#64748B]">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
