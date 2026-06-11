import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-[#EEF1F6] bg-white">
      <div className="mx-auto flex max-w-[1040px] flex-col gap-6 px-6 py-[28px] md:flex-row md:items-center md:justify-between">
        {/* 좌측: 워드마크 + 연락처 */}
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:gap-5">
          <span style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
            <span
              className="text-primary"
              style={{ fontFamily: 'Newsreader, Georgia, serif', fontStyle: 'italic', fontWeight: 500 }}
            >
              church
            </span>
            <span className="text-[#0E1729]" style={{ fontWeight: 800, marginLeft: 4 }}>
              round
            </span>
          </span>
          <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-[#94A3B8]">
            <a href="mailto:surfmind.sm@gmail.com" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <Mail className="h-3.5 w-3.5" />
              surfmind.sm@gmail.com
            </a>
            <a href="tel:010-6617-1875" className="inline-flex items-center gap-1.5 hover:text-foreground">
              <Phone className="h-3.5 w-3.5" />
              010-6617-1875
            </a>
          </div>
        </div>

        {/* 우측: 정책 링크 + 카피라이트 */}
        <div className="flex flex-col gap-2 text-[12.5px] text-[#94A3B8] md:items-end">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/terms')} className="hover:text-foreground">
              이용약관
            </button>
            <span className="text-[#CBD5E1]">·</span>
            <button onClick={() => navigate('/privacy')} className="hover:text-foreground">
              개인정보처리방침
            </button>
            <span className="text-[#CBD5E1]">·</span>
            <button onClick={() => navigate('/login')} className="hover:text-foreground">
              관리자 로그인
            </button>
          </div>
          <div>© 2026 Church Round. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
