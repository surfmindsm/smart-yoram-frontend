import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section
      id="hero"
      className="relative overflow-hidden pb-20 pt-32 md:pb-28 md:pt-40"
      style={{ background: 'linear-gradient(180deg, #F6F9FE 0%, #FFFFFF 100%)' }}
    >
      {/* 우상단 quote 장식 */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-10 top-[120px] hidden text-[240px] leading-none text-primary/10 md:block"
        style={{ fontFamily: 'Newsreader, serif', fontStyle: 'italic' }}
      >
        ”
      </span>

      <div className="mx-auto max-w-[1040px] px-6 text-center">
        {/* 배지 */}
        <span className="inline-block rounded-full bg-[#EAF1FE] px-3.5 py-1.5 text-[12.5px] font-bold text-primary">
          교회 행정 올인원 플랫폼
        </span>

        {/* 헤드라인 */}
        <h1 className="mx-auto mt-[22px] max-w-[760px] text-[32px] font-extrabold leading-[1.2] tracking-[-0.03em] text-[#0E1729] md:text-[46px]">
          교회의 모든 살림을<br />
          <span className="text-primary">한 곳에서</span> 단정하게.
        </h1>

        {/* 부제 */}
        <p className="mx-auto mt-[22px] max-w-[560px] text-[15px] leading-[1.6] text-[#64748B] md:text-[16.5px]">
          교인 관리부터 헌금, 예배 소식, 통계 분석까지.<br className="hidden sm:inline" />
          Church Round 하나로 교회 행정을 가볍게 만드세요.
        </p>

        {/* CTA */}
        <div className="mt-[30px] flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="inline-flex h-[50px] items-center gap-2 rounded-[10px] bg-primary px-[26px] text-[15px] font-bold text-white transition-colors hover:bg-primary/90"
          >
            <ArrowRight className="h-4 w-4" />
            무료로 시작하기
          </button>
          <button
            onClick={() => {
              const el = document.getElementById('features');
              if (el) {
                window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
              }
            }}
            className="inline-flex h-[50px] items-center rounded-[10px] border border-[#E3E8F0] bg-white px-6 text-[15px] font-semibold text-[#334155] transition-colors hover:bg-[#F8FAFD]"
          >
            기능 둘러보기
          </button>
        </div>

        {/* 대시보드 미리보기 */}
        <div
          className="mx-auto mt-12 hidden max-w-[920px] overflow-hidden rounded-[16px] border border-[#E3E8F0] bg-white md:block"
          style={{ boxShadow: '0 30px 60px -24px rgba(14, 23, 41, 0.25)' }}
        >
          <img
            src="/dashboard-preview.png"
            alt="Church Round 대시보드 미리보기"
            className="block h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
