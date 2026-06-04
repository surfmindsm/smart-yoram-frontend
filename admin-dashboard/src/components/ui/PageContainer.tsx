import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface PageHeaderProps {
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  className?: string;
}

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
}

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

// 페이지 헤더 컴포넌트 — Direction C: 23px/750, sub 13px muted, end-aligned actions
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions
}) => {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <h1 className="text-[23px] font-bold leading-tight tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-[3px] text-[13px] text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

// 통계 카드 컴포넌트
export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  className = ''
}) => {
  return (
    <Card className={`border-muted ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center">
          {icon && (
            <div className="p-3 rounded-lg bg-gray-100">
              {icon}
            </div>
          )}
          <div className={icon ? 'ml-4' : ''}>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            {trend && (
              <p className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.value}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 통계 카드 그리드
export const StatsGrid: React.FC<{ children: ReactNode; columns?: number }> = ({
  children,
  columns = 4
}) => {
  const gridClass = `grid grid-cols-1 md:grid-cols-${columns} gap-6 mb-6`;
  return <div className={gridClass}>{children}</div>;
};

// 필터 바 컴포넌트
export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = '검색...',
  filters,
  actions
}) => {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center flex-1 gap-4">
          {onSearchChange && (
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          )}
          {filters && <div className="flex items-center gap-2">{filters}</div>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

// 페이지 컨테이너 — Layout이 이미 외곽 p-6을 주므로 여기는 폭만 차지
export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      {children}
    </div>
  );
};

// 섹션 타이틀
export const SectionTitle: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-lg font-semibold text-foreground mb-4 ${className}`}>
      {children}
    </h3>
  );
};

// 테이블 컨테이너
export const TableContainer: React.FC<{
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}> = ({ title, description, children, className = '' }) => {
  return (
    <Card className={`border-muted ${className}`}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </CardHeader>
      )}
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
};
