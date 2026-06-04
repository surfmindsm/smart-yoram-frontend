import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const spinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      size: {
        default: "h-6 w-6",
        sm: "h-4 w-4",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      variant: {
        default: "text-primary",
        muted: "text-primary/70",
        white: "text-primary-foreground",
        destructive: "text-destructive",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  text?: string;
}

const SpinnerRoot = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, variant, size, text, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center gap-2", className)}
        {...props}
      >
        <Loader2 className={cn(spinnerVariants({ variant, size }))} />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }
);

SpinnerRoot.displayName = "Spinner";

/**
 * Page-level loading state — 카드/페이지 가운데 표시.
 * 시안 톤: 12px 회전 아이콘 + 13px muted 텍스트, 세로 정렬, 충분한 패딩.
 *
 * @example
 *   <LoadingState text="교인 목록을 불러오는 중..." />
 */
export interface LoadingStateProps {
  text?: string;
  /** 컨테이너 클래스 — 카드 안에서 쓸 때 카드 패딩 조정 등 */
  className?: string;
  /** 아이콘만 표시 (텍스트 없이) */
  iconOnly?: boolean;
  /** 카드로 감쌀지 여부 — 기본 false (외부에서 Card로 감싸는 경우 많음) */
  inCard?: boolean;
}

const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ text = '불러오는 중...', className, iconOnly, inCard }, ref) => {
    const content = (
      <div ref={ref} className={cn("flex flex-col items-center justify-center py-12", className)}>
        <Loader2 className="mb-3 h-10 w-10 animate-spin text-primary" />
        {!iconOnly && (
          <p className="text-[13px] text-muted-foreground">{text}</p>
        )}
      </div>
    );
    if (inCard) {
      return (
        <div className="rounded-[12px] border border-border bg-card">
          {content}
        </div>
      );
    }
    return content;
  }
);

LoadingState.displayName = "LoadingState";

// Spinner.Page 형태로도 접근 가능
const Spinner = Object.assign(SpinnerRoot, { Page: LoadingState });

export { Spinner, LoadingState, spinnerVariants };
