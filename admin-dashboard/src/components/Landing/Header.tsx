import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.offsetTop - headerHeight;
      window.scrollTo({ top: elementPosition, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const navigationItems = [
    { label: '핵심기능', id: 'features' },
    { label: '교회 커뮤니티', id: 'community' },
    { label: '도입절차', id: 'process' },
    { label: 'FAQ', id: 'faq' },
  ];


  return (
    <>
      <header className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-card/95 shadow-sm backdrop-blur-md' : 'bg-card/80 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex cursor-pointer items-center gap-3" onClick={() => scrollToSection('hero')}>
              <img
                src="/logo_yoram.png"
                alt="Church Round"
                className="h-10 w-auto"
              />
              <span style={{ fontSize: '22px', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                <span
                  className="text-primary"
                  style={{ fontFamily: 'Newsreader, Georgia, serif', fontStyle: 'italic', fontWeight: 500 }}
                >
                  church
                </span>
                <span className="text-foreground" style={{ fontWeight: 800, marginLeft: 4 }}>
                  round
                </span>
              </span>
            </div>

            <nav className="hidden lg:flex items-center gap-10">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-[13.5px] font-semibold text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="h-[38px] rounded-[8px] bg-primary px-5 text-[13.5px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                관리자 로그인
              </button>
            </div>

            <button
              className="rounded-[8px] p-2 transition-colors hover:bg-secondary lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6 text-foreground" /> : <Menu className="h-6 w-6 text-foreground" />}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-20 z-[60] overflow-y-auto bg-card lg:hidden">
          <nav className="flex flex-col gap-2 p-6">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="rounded-[8px] px-4 py-3 text-left text-base font-semibold text-foreground transition-colors hover:bg-[#FAFBFD]"
              >
                {item.label}
              </button>
            ))}
            <div className="mt-2 border-t border-border pt-2">
              <button
                onClick={() => {
                  navigate('/login');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full rounded-[8px] bg-primary px-5 py-3.5 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                관리자 로그인
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
