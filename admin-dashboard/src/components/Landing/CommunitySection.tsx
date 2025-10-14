import React from 'react';

export function CommunitySection() {
  const communityFeatures = [
    {
      icon: "🛍️",
      title: "중고 장터",
      description: "인증된 교인 간 거래로 안전한 교회 중심 중고 거래",
    },
    {
      icon: "💼",
      title: "구인·구직",
      description: "사역자, 반주자, 방송·음향 인력 등 교회 관련 구인 게시",
    },
    {
      icon: "📣",
      title: "교계 소식",
      description: "컨퍼런스, 세미나, 행사 등 대외 교계 소식 공유",
    },
    {
      icon: "🏗️",
      title: "교회 공사/업체 정보",
      description: "인증된 업자를 통해 합리적인 견적 확인",
    },
  ];

  return (
    <section id="community" className="py-16 px-6 bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold mb-3 text-foreground">
            교회 커뮤니티
          </h2>
          <p className="text-base text-muted-foreground">
            인증된 교인 간 안전한 거래와 소통
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {communityFeatures.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="w-14 h-14 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <h3 className="text-base font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
