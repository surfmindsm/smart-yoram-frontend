import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone } from "lucide-react";

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-slate-900 text-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-12 mb-12">
          {/* 좌측: 로고 및 슬로건 */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo_yoram.png"
                alt="Church Round"
                className="h-10 w-auto"
              />
              <div>
                <h3 className="text-2xl text-white">Church Round</h3>
                <p className="text-gray-400 text-sm">스마트 요람 플랫폼</p>
              </div>
            </div>
            
            <p className="text-lg text-gray-300 leading-relaxed">
              모든 교회와 교인을 연결하는<br />
              온라인 신앙 네트워크
            </p>
            
            <p className="text-gray-400 text-sm leading-relaxed">
              Church Round는 교회의 행정 효율화와 교인 소통을 지원하는 
              완전 무료 통합 플랫폼입니다.
            </p>
          </div>

          {/* 중간: 빠른 링크 */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg mb-4 text-white">서비스</h4>
              <div className="space-y-3">
                <a href="#features" className="flex items-center gap-2 text-gray-400 hover:text-[#0078FF] transition-colors">
                  <span>핵심 기능</span>
                </a>
                <a href="#community" className="flex items-center gap-2 text-gray-400 hover:text-[#0078FF] transition-colors">
                  <span>커뮤니티</span>
                </a>
                <a href="#process" className="flex items-center gap-2 text-gray-400 hover:text-[#0078FF] transition-colors">
                  <span>도입 절차</span>
                </a>
                <a href="#faq" className="flex items-center gap-2 text-gray-400 hover:text-[#0078FF] transition-colors">
                  <span>자주 묻는 질문</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-lg mb-4 text-white">정책</h4>
              <div className="space-y-3">
                <button onClick={() => navigate('/terms')} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
                  <span>이용약관</span>
                </button>
                <button onClick={() => navigate('/privacy')} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
                  <span>개인정보처리방침</span>
                </button>
                <button onClick={() => navigate('/login')} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
                  <span>관리자 로그인</span>
                </button>
              </div>
            </div>
          </div>

          {/* 우측: 연락처 및 지원 */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg mb-4 text-white">연락처</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#0078FF]" />
                  <a href="mailto:surfmind.sm@gmail.com" className="text-gray-400 hover:text-[#0078FF] transition-colors">
                  surfmind.sm@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#0078FF]" />
                  <a href="tel:010-6617-1875" className="text-gray-400 hover:text-[#0078FF] transition-colors">
                    010-6617-1875
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg mb-4 text-white">고객지원</h4>
              <div className="text-gray-400 text-sm space-y-1">
                <p>평일: 09:00 - 18:00</p>
                <p>토요일: 09:00 - 13:00</p>
                <p>일요일 및 공휴일: 휴무</p>
                {/* <p className="text-[#0078FF] mt-2">📞 24시간 온라인 지원 가능</p> */}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 구분선 및 저작권 */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © 2025 Church Round. All rights reserved.
            </div>
            
            {/* <div className="flex items-center gap-6 text-sm text-gray-400">
              <span>v2.1.0</span>
              <span>•</span>
              <span>2024.12.14 업데이트</span>
            </div> */}
          </div>
          
          {/* <div className="mt-4 text-center text-xs text-gray-500">
            전국 1,000+ 교회가 신뢰하는 Church Round와 함께 스마트한 교회 운영을 시작하세요
          </div> */}
        </div>
      </div>
    </footer>
  );
}