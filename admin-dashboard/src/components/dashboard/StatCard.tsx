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
}

const StatCard = React.memo<StatCardProps>(({ title, value, Icon, color, loading = false }) => {
  return (
    <Card className="border-muted">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className={cn("p-2 rounded-lg", color.replace('bg-', 'bg-') + '/10')}>
            <Icon className={cn("h-5 w-5", color.replace('bg-', 'text-'))} />
          </div>
          <div className="ml-3">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold text-foreground mt-0.5">
              {loading ? (
                <div className="w-12 h-7 bg-muted animate-pulse rounded"></div>
              ) : (
                value
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;