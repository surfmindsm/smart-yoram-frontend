import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';
import { cn } from '../../lib/utils';

export interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode;
  description?: string | React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  loading?: boolean;
  className?: string;
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
 * BaseDialog - 모든 다이얼로그의 기본이 되는 공통 컴포넌트
 *
 * shadcn Dialog를 래핑하여 일관된 스타일과 동작을 제공합니다.
 *
 * @example
 * <BaseDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="제목"
 *   description="설명"
 *   size="md"
 *   footer={<Button onClick={handleSubmit}>확인</Button>}
 * >
 *   <div>내용</div>
 * </BaseDialog>
 */
export const BaseDialog: React.FC<BaseDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  loading = false,
  className,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(sizeClasses[size], className)}
        onPointerDownOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="py-4">
          {children}
        </div>

        {footer && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            {footer}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BaseDialog;
