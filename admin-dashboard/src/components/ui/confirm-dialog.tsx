import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './dialog';
import { Button } from './button';
import { Spinner } from './spinner';
import { cn } from '../../lib/utils';

export interface ConfirmDialogProgress {
  current: number;
  total: number;
  currentTitle?: string;
}

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string | React.ReactNode;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  showProgress?: boolean;
  progress?: ConfirmDialogProgress;
  size?: 'sm' | 'md' | 'lg';
  hideCancel?: boolean;
}

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

/**
 * ConfirmDialog - 확인/취소가 필요한 간단한 다이얼로그
 *
 * 삭제 확인, 작업 확인 등에 사용되는 공통 컴포넌트입니다.
 * 진행률 표시 기능을 포함하고 있어 대량 작업에도 사용할 수 있습니다.
 *
 * @example
 * // 기본 사용
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="정말 삭제하시겠습니까?"
 *   description="이 작업은 되돌릴 수 없습니다."
 *   variant="destructive"
 *   onConfirm={handleDelete}
 *   loading={isDeleting}
 * />
 *
 * @example
 * // 진행률 표시와 함께 사용
 * <ConfirmDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="채팅 삭제"
 *   description="선택한 채팅을 삭제합니다."
 *   variant="destructive"
 *   onConfirm={handleBulkDelete}
 *   loading={isDeleting}
 *   showProgress={true}
 *   progress={{ current: 5, total: 10, currentTitle: "현재 삭제 중인 항목" }}
 * />
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  onConfirm,
  loading = false,
  showProgress = false,
  progress,
  size = 'md',
  hideCancel = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={loading ? undefined : onOpenChange}>
      <DialogContent
        className={cn(sizeClasses[size])}
        onPointerDownOutside={(e) => loading && e.preventDefault()}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* 진행률 표시 */}
          {loading && showProgress && progress && progress.total > 0 && (
            <div className="space-y-3">
              {/* 진행률 바 */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={cn(
                    'h-3 rounded-full transition-all duration-300 ease-out',
                    variant === 'destructive' ? 'bg-red-500' : 'bg-primary'
                  )}
                  style={{
                    width: `${Math.min((progress.current / progress.total) * 100, 100)}%`,
                  }}
                ></div>
              </div>

              {/* 진행률 텍스트 */}
              <div className="text-center space-y-2">
                <div className="text-sm font-medium text-gray-700">
                  {progress.current} / {progress.total} 완료
                  <span
                    className={cn(
                      'ml-2',
                      variant === 'destructive' ? 'text-red-600' : 'text-primary'
                    )}
                  >
                    ({Math.round((progress.current / progress.total) * 100)}%)
                  </span>
                </div>

                {/* 현재 처리 중인 항목 */}
                {progress.currentTitle && progress.current < progress.total && (
                  <div className="text-xs text-gray-500 truncate max-w-sm mx-auto">
                    처리 중: "{progress.currentTitle}"
                  </div>
                )}

                {/* 완료 메시지 */}
                {progress.current >= progress.total && (
                  <div className="text-sm text-green-600 font-medium">
                    ✅ 모든 작업 완료!
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 로딩 스피너 (진행률 없을 때) */}
          {loading && (!showProgress || !progress || progress.total === 0) && (
            <div className="flex justify-center py-4">
              <Spinner
                size="default"
                variant={variant === 'destructive' ? 'destructive' : 'default'}
              />
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {!hideCancel && (
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {cancelText}
            </Button>
          )}
          <Button
            variant={variant}
            onClick={handleConfirm}
            disabled={loading}
            className="min-w-[80px]"
          >
            {loading && (
              <Spinner
                size="sm"
                variant={variant === 'destructive' ? 'white' : 'default'}
                className="mr-1"
              />
            )}
            <span>{loading ? `${confirmText.replace('하기', '')} 중...` : confirmText}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
