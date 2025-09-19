import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
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
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn("p-3 rounded-lg", color.replace('bg-', 'bg-') + '/10')}>
            <Icon className={cn("h-6 w-6", color.replace('bg-', 'text-'))} />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-semibold text-foreground">
              {loading ? (
                <div className="w-12 h-8 bg-muted animate-pulse rounded"></div>
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