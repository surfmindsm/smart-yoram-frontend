import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Menu, X, Smartphone, LogIn } from 'lucide-react';

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
    { label: '서비스소개', id: 'hero' },
    { label: '핵심기능', id: 'features' },
  ];

  const handleAppDownload = () => {
    alert('앱 다운로드 기능은 준비 중입니다.\n\niOS: App Store\nAndroid: Play Store');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
            <img
              src="/logo_yoram.png"
              alt="Church Round"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="text-xl text-foreground leading-tight font-semibold">Church Round</h1>
              <p className="text-xs text-muted-foreground">스마트 요람 플랫폼</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {navigationItems.map((item) => (
              <button key={item.id} onClick={() => scrollToSection(item.id)} className="text-muted-foreground hover:text-primary transition-colors duration-200 relative group">
                {item.label}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></div>
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Button variant="outline" onClick={handleAppDownload} className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              앱 다운로드
            </Button>
            <Button onClick={() => navigate('/login')} className="flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              관리자 로그인
            </Button>
          </div>

          <button className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border py-4">
            <nav className="flex flex-col gap-4">
              {navigationItems.map((item) => (
                <button key={item.id} onClick={() => scrollToSection(item.id)} className="text-left text-muted-foreground hover:text-primary transition-colors py-2">
                  {item.label}
                </button>
              ))}
              <div className="pt-4 border-t border-border space-y-3">
                <Button variant="outline" onClick={handleAppDownload} className="w-full flex items-center justify-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  앱 다운로드
                </Button>
                <Button onClick={() => navigate('/login')} className="w-full flex items-center justify-center gap-2">
                  <LogIn className="w-4 h-4" />
                  관리자 로그인
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
