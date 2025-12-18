import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { FormDialog } from '../ui';
import { supabaseApiService } from '../../services/supabaseApiService';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'email' | 'phone';
}

/**
 * ContactModal - 랜딩 페이지 문의 폼
 *
 * FormDialog 공통 컴포넌트를 사용하여 리팩토링되었습니다.
 */
export function ContactModal({ isOpen, onClose, type }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Supabase Edge Function을 통해 이메일 전송
      await supabaseApiService.contact.sendEmail({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        type: type
      });

      setSubmitSuccess(true);

      // 3초 후 모달 닫기
      setTimeout(() => {
        setSubmitSuccess(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
        onClose();
      }, 3000);
    } catch (error) {
      console.error('문의 전송 실패:', error);
      alert('문의 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <FormDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={type === 'email' ? '이메일 문의' : '전화 상담 신청'}
      description={
        type === 'email'
          ? '문의 내용을 남겨주시면 빠르게 답변드리겠습니다.'
          : '상담 신청을 남겨주시면 연락드리겠습니다.'
      }
      onSubmit={handleSubmit}
      submitText="문의하기"
      submitIcon={<Send className="w-4 h-4" />}
      loading={isSubmitting}
      size="2xl"
      className="bg-gray-900 hover:bg-gray-800 text-white"
    >
      {submitSuccess ? (
        <div className="py-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">문의가 접수되었습니다</h3>
          <p className="text-gray-600">빠른 시일 내에 연락드리겠습니다.</p>
        </div>
      ) : (
        <>
          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 mb-2">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              placeholder="이름을 입력하세요"
              disabled={isSubmitting}
            />
          </div>

          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-2">
              이메일 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              placeholder="example@email.com"
              disabled={isSubmitting}
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-900 mb-2">
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all"
              placeholder="010-0000-0000"
              disabled={isSubmitting}
            />
          </div>

          {/* 문의 내용 */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-900 mb-2">
              문의 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all resize-none"
              placeholder="문의하실 내용을 자세히 작성해주세요"
              disabled={isSubmitting}
            />
          </div>
        </>
      )}
    </FormDialog>
  );
}
