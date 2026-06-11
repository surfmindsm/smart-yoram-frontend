import React from 'react';
import { Users, DollarSign, Calendar, BarChart3, Building2, ShieldCheck } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export function FeaturesSection() {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const features = [
    {
      Icon: Users,
      title: '교인 관리',
      desc: '교적·심방·중보기도까지 한 흐름으로. 가족·차량·성례 기록을 체계적으로 관리합니다.',
    },
    {
      Icon: DollarSign,
      title: '재정·헌금',
      desc: '십일조부터 건축헌금까지 종류별 통계와 기부금 영수증을 손쉽게 발급합니다.',
    },
    {
      Icon: Calendar,
      title: '예배·소식',
      desc: '예배 시간표, 주보, 오늘의 말씀, 공지와 푸시 알림을 교인 앱과 연결합니다.',
    },
    {
      Icon: BarChart3,
      title: '통계 분석',
      desc: '출석·연령·구역·증가 추이를 한눈에. 데이터로 목회를 돕습니다.',
    },
    {
      Icon: Building2,
      title: '조직 · 목장',
      desc: '부서·구역·목장 구조와 교인 배정을 트리로 관리합니다.',
    },
    {
      Icon: ShieldCheck,
      title: '안전한 운영',
      desc: '권한 관리와 보안 로그로 교회 데이터를 안전하게 지킵니다.',
    },
  ];

  return (
    <section
      id="features"
      ref={sectionRef}
      className="mx-auto max-w-[1040px] px-6 py-20 md:py-[80px]"
    >
      <div
        className={`text-center transition-all duration-700 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
      >
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#0E1729] md:text-[30px]">
          목회에 집중하도록, 행정은 가볍게
        </h2>
        <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-[#64748B] md:text-[15px]">
          교회 운영에 필요한 모든 기능을 한 플랫폼에서.
        </p>
      </div>

      <div className="mt-11 grid grid-cols-1 gap-[18px] md:grid-cols-2 md:gap-[22px] lg:grid-cols-3">
        {features.map(({ Icon, title, desc }, i) => (
          <div
            key={title}
            className={`rounded-[16px] border border-[#EEF1F6] bg-white p-[26px] transition-all duration-700 hover:border-primary/30 hover:shadow-[0_8px_24px_-12px_rgba(28,124,255,0.18)] ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
            style={{ transitionDelay: `${i * 80 + 200}ms` }}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#EAF1FE] text-primary">
              <Icon className="h-[23px] w-[23px]" />
            </div>
            <div className="text-[17px] font-bold tracking-[-0.01em] text-[#0E1729]">
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
