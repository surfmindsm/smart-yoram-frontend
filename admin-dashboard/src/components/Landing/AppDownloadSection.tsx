import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function AppDownloadSection() {
  const navigate = useNavigate();

  return (
    <section
      id="app-download"
      className="text-white"
      style={{ background: 'linear-gradient(135deg, #0E1729, #1B2740)' }}
    >
      <div className="mx-auto max-w-[1040px] px-6 py-16 md:py-[64px]">
        <div className="text-center">
          <h2 className="text-[26px] font-extrabold tracking-[-0.02em] md:text-[32px]">
            지금 우리 교회도 시작해 보세요
          </h2>
          <p className="mx-auto mt-3.5 max-w-[520px] text-[14px] leading-[1.7] text-[#9DB0CC] md:text-[15px]">
            설치 없이 웹에서 바로. 모든 기능을 평생 무료로 사용할 수 있습니다.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex h-[50px] items-center gap-2 rounded-[10px] bg-primary px-[26px] text-[15px] font-bold text-white transition-colors hover:bg-primary/90"
            >
              <ArrowRight className="h-4 w-4" />
              교회 무료 등록
            </button>
            <button
              onClick={() => navigate('/church-signup')}
              className="inline-flex h-[50px] items-center rounded-[10px] border border-white/15 bg-white/[0.06] px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
            >
              가입 상담 신청
            </button>
          </div>
        </div>

        {/* 교인용 앱 다운로드 */}
        <div className="mt-14 grid grid-cols-1 items-center gap-8 rounded-[16px] border border-white/10 bg-white/[0.04] p-6 md:grid-cols-[1fr_auto] md:p-8">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9DB0CC]">
              교인용 모바일 앱
            </div>
            <div className="mt-2 text-[18px] font-bold tracking-[-0.01em] md:text-[20px]">
              우리 교회를 손 안에 담아 보세요
            </div>
            <p className="mt-2 text-[13px] leading-[1.7] text-[#9DB0CC]">
              교인 명단, 주보, 공지, 헌금 내역을 어디서든 확인할 수 있습니다.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="https://apps.apple.com/app/id6749299505"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[50px] items-center gap-3 rounded-[10px] bg-white px-5 text-[#0E1729] transition-transform hover:-translate-y-0.5"
              >
                <img src="/apple_black.png" alt="Apple" className="h-6 w-6" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] opacity-60">Download on the</div>
                  <div className="text-[14px] font-bold">App Store</div>
                </div>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.surfmind.yoram"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[50px] items-center gap-3 rounded-[10px] bg-white px-5 text-[#0E1729] transition-transform hover:-translate-y-0.5"
              >
                <img src="/google_black.png" alt="Google Play" className="h-6 w-6" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] opacity-60">GET IT ON</div>
                  <div className="text-[14px] font-bold">Google Play</div>
                </div>
              </a>
            </div>
          </div>

          {/* QR 코드 */}
          <div className="hidden md:block">
            <div className="rounded-[12px] bg-white p-2.5">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  (process.env.REACT_APP_PRODUCTION_URL || window.location.origin) + '/download'
                )}`}
                alt="QR Code"
                className="h-[140px] w-[140px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
