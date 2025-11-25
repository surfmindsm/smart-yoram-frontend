import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ContactModal } from './ContactModal';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [contactModal, setContactModal] = useState<{ isOpen: boolean; type: 'email' | 'phone' | null }>({
    isOpen: false,
    type: null
  });

  const faqs = [
    {
      question: "정말 모든 기능이 무료인가요?",
      answer: "네, Church Round의 모든 핵심 기능은 완전 무료입니다. 교적 관리, 회계 관리, 헌금 관리, 주보 발행 등 교회 운영에 필요한 모든 기능을 제한 없이 사용하실 수 있습니다."
    },
    {
      question: "소규모 교회도 사용할 수 있나요?",
      answer: "물론입니다. 교인 10명부터 1,000명 이상까지 모든 규모의 교회에서 사용 가능하며, 규모에 따른 추가 비용은 없습니다."
    },
    {
      question: "도입 기간은 얼마나 걸리나요?",
      answer: "평균 1-2시간 내에 모든 설정이 완료됩니다. 상담 신청부터 계정 개설, 교육까지 전담 매니저가 안내해드립니다."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative py-32 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* 섹션 타이틀 */}
        <div className="mb-24">
          <p className="text-sm text-gray-400 font-light mb-6 tracking-wider">FAQ</p>
          <h2 className="text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-8">
            자주 묻는 질문
          </h2>
          <div className="w-16 h-px bg-gray-900"></div>
        </div>

        {/* FAQ 리스트 - 미니멀 스타일 */}
        <div className="space-y-0 border-t border-gray-200">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border-b border-gray-200"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full text-left py-8 flex items-start justify-between gap-8 hover:bg-gray-50 transition-colors px-4"
              >
                <div className="flex-1">
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                    {faq.question}
                  </h3>
                  {openIndex === index && (
                    <p className="text-lg text-gray-600 font-light leading-relaxed mt-6 max-w-3xl">
                      {faq.answer}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`w-6 h-6 text-gray-400 flex-shrink-0 mt-1 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* 추가 문의 CTA - 미니멀 */}
        <div className="mt-24">
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                더 궁금한 점이<br />있으신가요?
              </h3>
              <p className="text-lg text-gray-600 font-light leading-relaxed">
                전담 매니저가 친절하게 안내해드립니다
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setContactModal({ isOpen: true, type: 'email' })}
                className="group flex items-center justify-between p-6 border border-gray-200 rounded-2xl hover:border-gray-900 transition-all"
              >
                <span className="text-lg font-medium text-gray-900">이메일 문의</span>
                <span className="text-gray-400 group-hover:translate-x-2 transition-transform">→</span>
              </button>
              <button
                onClick={() => setContactModal({ isOpen: true, type: 'phone' })}
                className="group flex items-center justify-between p-6 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all"
              >
                <span className="text-lg font-medium">전화 상담</span>
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ isOpen: false, type: null })}
        type={contactModal.type || 'email'}
      />
    </section>
  );
}
