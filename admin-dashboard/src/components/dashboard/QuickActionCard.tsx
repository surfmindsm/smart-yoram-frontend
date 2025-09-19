import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface QuickActionCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  link: string;
  color: string;
}

const QuickActionCard = React.memo<QuickActionCardProps>(({ title, description, Icon, link, color }) => {
  return (
    <Link to={link}>
      <Card className="border-muted hover:shadow-md transition-shadow duration-200 cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className={cn("p-3 rounded-lg transition-colors", color.replace('bg-', 'bg-') + '/10', "group-hover:" + color.replace('bg-', 'bg-') + '/20')}>
              <Icon className={cn("h-6 w-6", color.replace('bg-', 'text-'))} />
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-medium text-foreground">{title}</h4>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

QuickActionCard.displayName = 'QuickActionCard';

export default QuickActionCard;