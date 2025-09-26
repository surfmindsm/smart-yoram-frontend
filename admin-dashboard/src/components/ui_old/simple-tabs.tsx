import React from 'react';
import { cn } from '../../lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface SimpleTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills';
  className?: string;
}

export function SimpleTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  className
}: SimpleTabsProps) {
  if (variant === 'pills') {
    return (
      <div className={cn("bg-muted rounded-lg p-1 inline-flex", className)}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "py-2 px-4 rounded-md font-medium transition-all duration-200 flex items-center space-x-2",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium ml-1",
                activeTab === tab.id
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex space-x-1", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow"
              : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {tab.icon}
          <span className={tab.icon ? "ml-2" : ""}>{tab.label}</span>
          {typeof tab.count === 'number' && (
            <span className={cn(
              "ml-2 px-1.5 py-0.5 rounded-full text-xs",
              activeTab === tab.id
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}