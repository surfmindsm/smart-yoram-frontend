import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from "../ui";
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  Icon: LucideIcon;
  color: string;
  loading?: boolean;
  subtitle?: string;
}

const StatCard = React.memo<StatCardProps>(({ title, value, Icon, color, loading = false, subtitle }) => {
  // 색상에 따른 그라데이션 배경 설정
  const getGradientClass = (colorClass: string) => {
    if (colorClass.includes('primary')) return 'from-blue-50 to-blue-100/50 border-blue-200';
    if (colorClass.includes('green')) return 'from-green-50 to-green-100/50 border-green-200';
    if (colorClass.includes('purple')) return 'from-purple-50 to-purple-100/50 border-purple-200';
    if (colorClass.includes('yellow')) return 'from-yellow-50 to-yellow-100/50 border-yellow-200';
    return 'from-slate-50 to-slate-100/50 border-slate-200';
  };

  const getIconBgClass = (colorClass: string) => {
    if (colorClass.includes('primary')) return 'bg-blue-500/10';
    if (colorClass.includes('green')) return 'bg-green-500/10';
    if (colorClass.includes('purple')) return 'bg-purple-500/10';
    if (colorClass.includes('yellow')) return 'bg-yellow-500/10';
    return 'bg-slate-500/10';
  };

  const getIconColorClass = (colorClass: string) => {
    if (colorClass.includes('primary')) return 'text-blue-600';
    if (colorClass.includes('green')) return 'text-green-600';
    if (colorClass.includes('purple')) return 'text-purple-600';
    if (colorClass.includes('yellow')) return 'text-yellow-600';
    return 'text-slate-600';
  };

  return (
    <Card className={cn("border shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-br", getGradientClass(color))}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-2">{title}</p>
            <div className="text-2xl font-bold text-slate-800">
              {loading ? (
                <div className="w-16 h-8 bg-white/50 animate-pulse rounded-lg"></div>
              ) : (
                value
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium mt-1.5">{subtitle}</p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl shadow-sm", getIconBgClass(color))}>
            <Icon className={cn("h-6 w-6", getIconColorClass(color))} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;