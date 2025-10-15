import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FeaturesSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const features = [
    {
      number: "01",
      title: "교적 관리",
      details: [
        "교인 기본정보, 가족관계, 직분, 봉사부서 등 모든 정보를 한 곳에서 관리",
        "교인 검색 및 필터링으로 원하는 정보를 빠르게 조회",
        "출석 체크 및 통계 분석으로 교회 성장 추이 파악",
        "엑셀 다운로드 및 데이터 이전 지원으로 기존 자료 활용"
      ]
    },
    {
      number: "02",
      title: "스마트 요람",
      details: [
        "iOS/Android 앱으로 교인 명단을 언제 어디서나 조회",
        "전화, 문자, 이메일 등 빠른 연락 기능 제공",
        "권한별 정보 공개 설정으로 개인정보 보호",
        "오프라인에서도 기본 정보 확인 가능"
      ]
    },
    {
      number: "03",
      title: "교회 소식",
      details: [
        "주보 PDF 업로드 및 모바일 앱 자동 배포",
        "교회 행사 일정 등록 및 알림 발송",
        "기도제목 공유 및 교인 간 기도 응답 공유",
        "공지사항 카테고리별 관리 및 푸시 알림"
      ]
    },
    {
      number: "04",
      title: "커뮤니티",
      details: [
        "무료나눔, 물품판매, 물품요청 게시판 운영",
        "구인공고 및 구직 정보 교류",
        "찬양팀 모집 및 봉사자 구인 기능",
        "교인 인증을 통한 안전한 거래 환경 제공"
      ]
    }
  ];

  return (
    <section id="features" className="relative py-32 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* 섹션 타이틀 - Big Typo */}
        <div className="mb-24">
          <p className="text-sm text-gray-400 font-light mb-6 tracking-wider">FEATURES</p>
          <h2 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-8">
            핵심 기능
          </h2>
          <div className="w-16 h-px bg-gray-900"></div>
        </div>

        {/* 기능 목록 - 아코디언 */}
        <div className="space-y-0 border-t border-gray-200">
          {features.map((feature, index) => (
            <div
              key={index}
              className="border-b border-gray-200"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left py-8 px-4 hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between gap-8">
                  {/* 왼쪽: 번호와 타이틀 */}
                  <div className="flex items-start gap-8 flex-1">
                    <span className="text-sm text-gray-400 font-light min-w-[40px]">
                      {feature.number}
                    </span>
                    <div className="flex-1">
                      <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                        {feature.title}
                      </h3>

                      {/* 상세 내용 - 아코디언 */}
                      {openIndex === index && (
                        <div className="mt-6 pt-6 border-t border-gray-200 max-w-3xl">
                          <ul className="space-y-4">
                            {feature.details.map((detail, detailIndex) => (
                              <li key={detailIndex} className="flex items-start gap-3">
                                <span className="text-gray-400 mt-1">•</span>
                                <span className="text-base text-gray-600 font-light leading-relaxed">
                                  {detail}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 오른쪽: 화살표 아이콘 */}
                  <ChevronDown
                    className={`w-6 h-6 text-gray-400 flex-shrink-0 mt-1 transition-transform duration-300 ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}