import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "정말 모든 기능이 무료인가요?",
      answer: "네, Church Round의 모든 핵심 기능은 완전 무료입니다. 교적 관리, 헌금 관리, 주보 발행 등 교회 운영에 필요한 모든 기능을 제한 없이 사용하실 수 있습니다."
    },
    {
      question: "기존 교적부 데이터를 이전할 수 있나요?",
      answer: "네, 전문 매니저가 데이터 손실 없이 100% 안전하게 이전해드립니다. Excel, Access 등 기존 시스템에서 평균 1-2주 내로 완료됩니다."
    },
    {
      question: "소규모 교회도 사용할 수 있나요?",
      answer: "물론입니다. 교인 10명부터 1,000명 이상까지 모든 규모의 교회에서 사용 가능하며, 규모에 따른 추가 비용은 없습니다."
    },
    {
      question: "도입 기간은 얼마나 걸리나요?",
      answer: "평균 1-2주 내에 모든 설정이 완료됩니다. 상담 신청부터 계정 개설, 데이터 이전, 교육까지 전담 매니저가 안내해드립니다."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 px-6 bg-background">
      <div className="max-w-3xl mx-auto">
        {/* 섹션 타이틀 */}
        <div className="text-center mb-12">
          <h2 className="text-2xl lg:text-3xl font-bold mb-3 text-foreground">
            자주 묻는 질문
          </h2>
          <p className="text-base text-muted-foreground">
            궁금한 점을 빠르게 확인하세요
          </p>
        </div>

        {/* FAQ 아코디언 */}
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
              >
                <span className="text-base font-medium text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-5 pb-4 pt-1">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
