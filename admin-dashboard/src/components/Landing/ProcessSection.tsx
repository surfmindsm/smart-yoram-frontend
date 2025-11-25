import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

export function ProcessSection() {
  const [sectionRef, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  const steps = [
    {
      number: "①",
      title: "도입 상담 신청",
      description: "간단한 교회 정보 입력 후 전담 매니저 배정",
      icon: "💬",
      bgColor: "bg-blue-50"
    },
    {
      number: "②",
      title: "관리자 계정 개설",
      description: "교회 관리자용 계정 발급 및 초기 세팅 지원",
      icon: "🧭",
      bgColor: "bg-green-50"
    },
    {
      number: "③",
      title: "서비스 시작",
      description: "교적·요람·커뮤니티 즉시 사용 가능",
      icon: "🚀",
      bgColor: "bg-blue-50"
    }
  ];

  return (
    <section id="process" className="relative py-32 px-6 bg-gray-50" ref={sectionRef}>
      <div className="max-w-7xl mx-auto">
        {/* 섹션 타이틀 */}
        <div className={`mb-24 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-sm text-gray-400 font-light mb-6 tracking-wider">PROCESS</p>
          <h2 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-8">
            도입 절차
          </h2>
          <p className="text-xl text-gray-600 font-light max-w-2xl leading-relaxed">
            평균 1-2시간 내 모든 설정 완료
          </p>
        </div>

        {/* 세로 타임라인 레이아웃 */}
        <div className="space-y-0 border-l-2 border-gray-200 ml-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`group relative pl-12 pb-16 last:pb-0 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
              style={{ transitionDelay: `${index * 150 + 300}ms` }}
            >
              {/* 타임라인 도트 */}
              <div className="absolute -left-3 top-0 w-5 h-5 bg-gray-900 rounded-full group-hover:scale-125 transition-transform"></div>

              {/* 컨텐츠 */}
              <div>
                <span className="text-sm text-gray-400 font-light mb-4 block">
                  STEP {index + 1}
                </span>
                <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-lg text-gray-600 font-light leading-relaxed max-w-2xl">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-20 pt-12 border-t border-gray-200">
          <p className="text-gray-500 font-light mb-2">지금 바로 시작하세요</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>무료 도입 상담</span>
            <span>·</span>
            <span>1-2시간 빠른 설정</span>
          </div>
        </div>
      </div>
    </section>
  );
}
