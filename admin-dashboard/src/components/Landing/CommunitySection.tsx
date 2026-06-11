import React from 'react';
import { ShoppingBag, Briefcase, Newspaper, Wrench } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export function CommunitySection() {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const items = [
    {
      Icon: ShoppingBag,
      title: '중고 장터',
      desc: '인증된 교인 간 거래로 안전한 교회 중심 중고 거래.',
      tint: { bg: '#EAF1FE', fg: '#2563EB' },
    },
    {
      Icon: Briefcase,
      title: '구인·구직',
      desc: '사역자, 반주자, 방송·음향 인력 등 교회 관련 구인 게시.',
      tint: { bg: '#E7F6EC', fg: '#16A34A' },
    },
    {
      Icon: Newspaper,
      title: '교계 소식',
      desc: '컨퍼런스, 세미나, 행사 등 대외 교계 소식 공유.',
      tint: { bg: '#F3EAFE', fg: '#7E22CE' },
    },
    {
      Icon: Wrench,
      title: '교회 공사·업체',
      desc: '인증된 업자를 통해 합리적인 견적을 확인하세요.',
      tint: { bg: '#FBF1E3', fg: '#B45309' },
    },
  ];

  return (
    <section
      id="community"
      ref={sectionRef}
      className="bg-[#F8FAFD] py-20 md:py-[80px]"
    >
      <div className="mx-auto max-w-[1040px] px-6">
        <div
          className={`text-center transition-all duration-700 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          }`}
        >
          <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#0E1729] md:text-[30px]">
            교회 커뮤니티
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-[#64748B] md:text-[15px]">
            인증된 교인 간 안전한 거래와 소통을 한 곳에서.
          </p>
        </div>

        <div className="mt-11 grid grid-cols-1 gap-[18px] md:grid-cols-2 md:gap-[22px]">
          {items.map(({ Icon, title, desc, tint }, i) => (
            <div
              key={title}
              className={`rounded-[16px] border border-[#EEF1F6] bg-white p-[26px] transition-all duration-700 hover:border-primary/30 hover:shadow-[0_8px_24px_-12px_rgba(28,124,255,0.18)] ${
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
              }`}
              style={{ transitionDelay: `${i * 80 + 200}ms` }}
            >
              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-[12px]"
                style={{ background: tint.bg, color: tint.fg }}
              >
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
      </div>
    </section>
  );
}
