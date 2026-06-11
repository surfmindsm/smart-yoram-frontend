import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 64, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const navigationItems = [
    { label: '핵심 기능', id: 'features' },
    { label: '교회 커뮤니티', id: 'community' },
    { label: '도입 절차', id: 'process' },
    { label: 'FAQ', id: 'faq' },
  ];

  return (
    <>
      <header
        className={`fixed left-0 right-0 top-0 z-50 transition-all ${
          isScrolled
            ? 'border-b border-[#EEF1F6] bg-white/90 backdrop-blur'
            : 'bg-white/70 backdrop-blur'
        }`}
      >
        <div className="mx-auto max-w-[1040px] px-6">
          <div className="flex h-16 items-center">
            <button
              onClick={() => scrollToSection('hero')}
              className="inline-flex items-center"
              style={{ fontSize: 22, letterSpacing: '-0.01em' }}
            >
              <span
                className="text-primary"
                style={{ fontFamily: 'Newsreader, Georgia, serif', fontStyle: 'italic', fontWeight: 500 }}
              >
                church
              </span>
              <span className="text-[#0E1729]" style={{ fontWeight: 800, marginLeft: 4 }}>
                round
              </span>
            </button>

            <nav className="ml-10 hidden items-center gap-7 lg:flex">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-[13.5px] font-semibold text-[#475569] transition-colors hover:text-[#0E1729]"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-2.5">
              <button
                onClick={() => navigate('/login')}
                className="hidden h-[36px] items-center px-3 text-[13.5px] font-semibold text-[#475569] transition-colors hover:text-[#0E1729] lg:inline-flex"
              >
                로그인
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hidden h-[38px] items-center rounded-[10px] bg-primary px-[18px] text-[13.5px] font-bold text-white transition-colors hover:bg-primary/90 lg:inline-flex"
              >
                무료로 시작하기
              </button>
              <button
                className="rounded-[8px] p-2 transition-colors hover:bg-[#F8FAFD] lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5 text-[#0E1729]" /> : <Menu className="h-5 w-5 text-[#0E1729]" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-[60] overflow-y-auto bg-white lg:hidden">
          <nav className="flex flex-col gap-1 p-6">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="rounded-[8px] px-4 py-3 text-left text-[15px] font-semibold text-[#0E1729] transition-colors hover:bg-[#F8FAFD]"
              >
                {item.label}
              </button>
            ))}
            <div className="mt-2 border-t border-[#EEF1F6] pt-3">
              <button
                onClick={() => {
                  navigate('/login');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full rounded-[10px] bg-primary px-5 py-3 text-[14px] font-bold text-white transition-colors hover:bg-primary/90"
              >
                무료로 시작하기
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
