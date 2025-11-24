import React from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export function CommunitySection() {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  const communityFeatures = [
    {
      title: "중고 장터",
      description: "인증된 교인 간 거래로 안전한 교회 중심 중고 거래",
    },
    {
      title: "구인·구직",
      description: "사역자, 반주자, 방송·음향 인력 등 교회 관련 구인 게시",
    },
    {
      title: "교계 소식",
      description: "컨퍼런스, 세미나, 행사 등 대외 교계 소식 공유",
    },
    {
      title: "교회 공사/업체 정보",
      description: "인증된 업자를 통해 합리적인 견적 확인",
    },
  ];

  return (
    <section id="community" className="relative py-32 px-6 bg-white" ref={sectionRef}>
      <div className="max-w-7xl mx-auto">
        {/* 섹션 타이틀 */}
        <div className={`mb-24 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-sm text-gray-400 font-light mb-6 tracking-wider">COMMUNITY</p>
          <h2 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-8">
            교회 커뮤니티
          </h2>
          <p className="text-xl text-gray-600 font-light max-w-2xl leading-relaxed">
            인증된 교인 간 안전한 거래와 소통
          </p>
        </div>

        {/* 2x2 그리드 레이아웃 */}
        <div className="grid md:grid-cols-2 gap-px bg-gray-200">
          {communityFeatures.map((feature, index) => (
            <div
              key={index}
              className={`group bg-gray-50 p-12 hover:bg-white transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: `${index * 150 + 300}ms` }}
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 font-light leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
