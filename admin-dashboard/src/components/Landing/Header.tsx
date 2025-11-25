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
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white/80 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
              <img
                src="/logo_yoram.png"
                alt="Church Round"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl text-gray-900 leading-tight font-bold">Church Round</h1>
                <p className="text-xs text-gray-500 font-light">스마트 요람 플랫폼</p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-10">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-sm bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all font-medium"
              >
                관리자 로그인
              </button>
            </div>

            <button
              className="lg:hidden p-2 rounded-2xl hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-gray-900" /> : <Menu className="w-6 h-6 text-gray-900" />}
            </button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-20 bg-white z-[60] overflow-y-auto">
          <nav className="flex flex-col gap-2 p-6">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="text-left text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors py-3 px-4 font-medium text-base rounded-xl"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-200">
              <button
                onClick={() => {
                  navigate('/login');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full px-5 py-3.5 text-base bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-medium"
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
