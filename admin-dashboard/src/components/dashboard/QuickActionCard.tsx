import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { Card } from "../ui";

interface QuickActionCardProps {
  title: string;
  description: string;
  Icon: LucideIcon;
  link: string;
  color: string;
}

// 시안 매핑: 38px rounded-[10px] accent tint + title 13.5/700 + sub 11.5 muted
const QuickActionCard = React.memo<QuickActionCardProps>(({ title, description, Icon, link }) => {
  return (
    <Link to={link} className="block">
      <Card className="cursor-pointer transition-colors hover:border-[#BBD4FB]">
        <div className="flex items-center gap-3 px-4 py-[18px]">
          <div className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[11px] bg-[#EEF3FC] text-primary">
            <Icon className="h-[19px] w-[19px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13.5px] font-bold text-foreground">{title}</div>
            <div className="mt-px text-[11.5px] text-[#94A3B8]">{description}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
});

QuickActionCard.displayName = 'QuickActionCard';

export default QuickActionCard;
