import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from "../ui";
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  Icon: LucideIcon;
  color?: string;
  loading?: boolean;
  /** 라벨 옆 작은 단위 (예: "명", "만원") — value에서 자동 추출도 시도 */
  unit?: string;
  /** 델타/부제 (예: "+7 이번 주", "73% 출석률") */
  subtitle?: string;
}

// 시안 매핑: 라벨 + primary 아이콘(14px) · 큰 숫자(28px/750) + 작은 단위 · 델타 한 줄
const StatCard = React.memo<StatCardProps>(({ title, value, Icon, loading = false, unit, subtitle }) => {
  const isNegative = !!subtitle && /-\s*\d|감소|하락/.test(subtitle);
  const deltaColor = isNegative ? 'text-[#DC2626]' : 'text-[#16A34A]';
  const DeltaIcon = isNegative ? TrendingDown : TrendingUp;

  // unit이 명시 안 되었으면 value 끝에서 한글 단위 자동 추출 (예: "842명" → 숫자 "842" + 단위 "명")
  let displayValue = value;
  let displayUnit = unit;
  if (!unit && value) {
    const match = value.match(/^([\d,.]+)\s*(.+)$/);
    if (match) {
      displayValue = match[1];
      displayUnit = match[2];
    }
  }

  return (
    <Card className="transition-colors hover:border-[#BBD4FB]">
      <div className="px-5 py-[18px]">
        <div className="flex items-center gap-[7px] text-[12px] font-semibold text-muted-foreground">
          <Icon className="h-[14px] w-[14px] text-primary" />
          {title}
        </div>
        <div className="mt-[9px] flex items-baseline gap-1.5 leading-none">
          {loading ? (
            <div className="h-[26px] w-20 animate-pulse rounded-md bg-secondary" />
          ) : (
            <>
              <span className="text-[28px] font-bold tracking-[-0.02em] tabular-nums text-foreground">
                {displayValue}
              </span>
              {displayUnit && (
                <span className="text-[13px] font-semibold text-[#94A3B8]">{displayUnit}</span>
              )}
            </>
          )}
        </div>
        {subtitle && (
          <div className={cn('mt-2 flex items-center gap-1 text-[11.5px] font-semibold', deltaColor)}>
            <DeltaIcon className="h-3 w-3" />
            {subtitle}
          </div>
        )}
      </div>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
