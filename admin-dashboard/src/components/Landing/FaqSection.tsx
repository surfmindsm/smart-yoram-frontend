import React, { useState } from 'react';
import { ChevronDown, Mail } from 'lucide-react';
import { ContactModal } from './ContactModal';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [contactModal, setContactModal] = useState<{ isOpen: boolean; type: 'email' | 'phone' | null }>({
    isOpen: false,
    type: null,
  });

  const faqs = [
    {
      q: '정말 모든 기능이 무료인가요?',
      a: '네, Church Round의 모든 핵심 기능은 완전 무료입니다. 교적 관리, 회계 관리, 헌금 관리, 주보 발행 등 교회 운영에 필요한 모든 기능을 제한 없이 사용하실 수 있습니다.',
    },
    {
      q: '소규모 교회도 사용할 수 있나요?',
      a: '물론입니다. 교인 10명부터 1,000명 이상까지 모든 규모의 교회에서 사용 가능하며, 규모에 따른 추가 비용은 없습니다.',
    },
    {
      q: '도입 기간은 얼마나 걸리나요?',
      a: '평균 1–2시간 내에 모든 설정이 완료됩니다. 상담 신청부터 계정 개설, 교육까지 전담 매니저가 안내해 드립니다.',
    },
  ];

  return (
    <section id="faq" className="bg-[#F8FAFD] py-20 md:py-[80px]">
      <div className="mx-auto max-w-[840px] px-6">
        <div className="text-center">
          <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-[#0E1729] md:text-[30px]">
            자주 묻는 질문
          </h2>
          <p className="mx-auto mt-3 max-w-[560px] text-[14px] text-[#64748B] md:text-[15px]">
            더 궁금한 점이 있으시면 언제든 문의해 주세요.
          </p>
        </div>

        <div className="mt-11 space-y-2">
          {faqs.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-[14px] border border-[#EEF1F6] bg-white"
              >
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-[18px] text-left transition-colors hover:bg-[#FAFBFD]"
                >
                  <span className="text-[15px] font-bold tracking-[-0.01em] text-[#0E1729] md:text-[16px]">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-[#94A3B8] transition-transform ${
                      open ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {open && (
                  <div className="border-t border-[#EEF1F6] bg-[#FAFBFD] px-5 py-[18px]">
                    <p className="text-[13.5px] leading-[1.7] text-[#475569] md:text-[14.5px]">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 추가 문의 */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-[16px] border border-[#EEF1F6] bg-white p-6 md:flex-row md:items-center">
          <div>
            <div className="text-[15px] font-bold text-[#0E1729]">더 궁금한 점이 있으신가요?</div>
            <div className="mt-1 text-[13px] text-[#64748B]">전담 매니저가 친절하게 안내해 드립니다.</div>
          </div>
          <button
            onClick={() => setContactModal({ isOpen: true, type: 'email' })}
            className="inline-flex h-[44px] items-center gap-2 rounded-[10px] bg-[#0E1729] px-5 text-[13.5px] font-bold text-white transition-colors hover:bg-[#1B2740]"
          >
            <Mail className="h-4 w-4" />
            이메일 문의
          </button>
        </div>
      </div>

      <ContactModal
        isOpen={contactModal.isOpen}
        onClose={() => setContactModal({ isOpen: false, type: null })}
        type={contactModal.type || 'email'}
      />
    </section>
  );
}
