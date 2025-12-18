import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';
import { Button } from './button';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  submitText?: string;
  cancelText?: string;
  submitIcon?: React.ReactNode;
  loading?: boolean;
  submitDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  hideCancel?: boolean;
  className?: string;
  customFooter?: React.ReactNode;
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  full: 'sm:max-w-full',
};

/**
 * FormDialog - 폼 입력이 필요한 다이얼로그
 *
 * 폼 제출 로직이 포함된 다이얼로그 컴포넌트입니다.
 * 자동으로 폼 제출을 처리하고 로딩 상태를 관리합니다.
 *
 * @example
 * // 기본 사용
 * <FormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="문의하기"
 *   description="문의 내용을 입력해주세요"
 *   onSubmit={handleSubmit}
 *   submitText="전송"
 *   loading={isSubmitting}
 * >
 *   <Input name="email" placeholder="이메일" />
 *   <Textarea name="message" placeholder="내용" />
 * </FormDialog>
 *
 * @example
 * // 커스텀 푸터 사용
 * <FormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="비밀번호 변경"
 *   onSubmit={handleSubmit}
 *   customFooter={
 *     <div className="flex gap-2">
 *       <Button onClick={() => setIsOpen(false)}>취소</Button>
 *       <Button type="submit">변경</Button>
 *     </div>
 *   }
 * >
 *   <Input type="password" placeholder="새 비밀번호" />
 * </FormDialog>
 */
export const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  submitText = '확인',
  cancelText = '취소',
  submitIcon,
  loading = false,
  submitDisabled = false,
  size = 'md',
  hideCancel = false,
  className,
  customFooter,
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent
        className={cn(sizeClasses[size], className)}
        onPointerDownOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="py-4 space-y-4">{children}</div>

          {/* 푸터 */}
          {customFooter ? (
            <div className="pt-4 border-t">{customFooter}</div>
          ) : (
            <div className="flex justify-end gap-2 pt-4 border-t">
              {!hideCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  {cancelText}
                </Button>
              )}
              <Button type="submit" disabled={loading || submitDisabled}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {submitText.includes('하기') || submitText.includes('전송') || submitText.includes('등록')
                      ? `${submitText.replace('하기', '').replace('전송', '').replace('등록', '')} 중...`
                      : '처리 중...'}
                  </>
                ) : (
                  <>
                    {submitIcon && <span className="mr-2">{submitIcon}</span>}
                    {submitText}
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
