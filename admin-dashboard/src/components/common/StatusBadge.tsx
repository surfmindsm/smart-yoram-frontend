/**
 * 상태 표시 배지 공통 컴포넌트
 *
 * @description 커뮤니티 게시글의 상태를 표시하는 공통 배지 컴포넌트입니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

import React from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  AlertCircle,
  Info
} from 'lucide-react';
import { CommunityStatus } from '../../types';
import { getStatusLabel, getStatusClass } from '../../utils/status-mapping';

interface StatusBadgeProps {
  status: CommunityStatus;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  variant = 'solid',
  showIcon = true,
  className = ''
}) => {
  const label = getStatusLabel(status);
  const Icon = getStatusIcon(status);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const baseClasses = `inline-flex items-center gap-1.5 font-medium rounded-full ${sizeClasses[size]}`;

  let variantClasses = '';

  switch (variant) {
    case 'solid':
      variantClasses = getStatusClass(status);
      break;
    case 'outline':
      variantClasses = getStatusOutlineClass(status);
      break;
    case 'subtle':
      variantClasses = getStatusSubtleClass(status);
      break;
  }

  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {showIcon && <Icon className={iconSizes[size]} />}
      {label}
    </span>
  );
};

/**
 * 상태별 아이콘 반환
 */
function getStatusIcon(status: CommunityStatus) {
  const iconMap: Record<CommunityStatus, React.ComponentType<any>> = {
    active: Clock,
    completed: CheckCircle,
    cancelled: XCircle,
    paused: Pause
  };

  return iconMap[status] || Info;
}

/**
 * outline 스타일 클래스 반환
 */
function getStatusOutlineClass(status: CommunityStatus): string {
  const classMap: Record<CommunityStatus, string> = {
    active: 'border border-primary-500 text-primary-700 bg-white',
    completed: 'border border-green-500 text-green-700 bg-white',
    cancelled: 'border border-red-500 text-red-700 bg-white',
    paused: 'border border-yellow-500 text-yellow-700 bg-white'
  };

  return classMap[status] || 'border border-gray-500 text-gray-700 bg-white';
}

/**
 * subtle 스타일 클래스 반환
 */
function getStatusSubtleClass(status: CommunityStatus): string {
  const classMap: Record<CommunityStatus, string> = {
    active: 'text-primary-800 bg-primary-50',
    completed: 'text-green-800 bg-green-50',
    cancelled: 'text-red-800 bg-red-50',
    paused: 'text-yellow-800 bg-yellow-50'
  };

  return classMap[status] || 'text-gray-800 bg-gray-50';
}

/**
 * 상태 필터 선택용 드롭다운 컴포넌트
 */
export const StatusFilter: React.FC<{
  value: CommunityStatus | 'all';
  onChange: (status: CommunityStatus | 'all') => void;
  options?: Array<{ value: CommunityStatus | 'all'; label: string }>;
  className?: string;
}> = ({
  value,
  onChange,
  options,
  className = ''
}) => {
  const defaultOptions = [
    { value: 'all' as const, label: '전체 상태' },
    { value: 'active' as const, label: '활성' },
    { value: 'completed' as const, label: '완료' },
    { value: 'cancelled' as const, label: '취소' },
    { value: 'paused' as const, label: '일시중지' }
  ];

  const filterOptions = options || defaultOptions;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CommunityStatus | 'all')}
      className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${className}`}
    >
      {filterOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

/**
 * 상태별 통계를 표시하는 컴포넌트
 */
export const StatusStats: React.FC<{
  stats: Record<CommunityStatus, number>;
  total?: number;
  className?: string;
}> = ({ stats, total, className = '' }) => {
  const totalCount = total || Object.values(stats).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {Object.entries(stats).map(([status, count]) => {
        const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

        return (
          <div
            key={status}
            className="bg-white rounded-lg border p-4 text-center"
          >
            <div className="mb-2">
              <StatusBadge
                status={status as CommunityStatus}
                variant="subtle"
                size="sm"
              />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {count.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {percentage}%
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 상태 변경 이력을 표시하는 컴포넌트
 */
export const StatusHistory: React.FC<{
  history: Array<{
    status: CommunityStatus;
    changedAt: string;
    changedBy?: string;
    note?: string;
  }>;
  className?: string;
}> = ({ history, className = '' }) => {
  if (!history.length) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        상태 변경 이력이 없습니다.
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {history.map((item, index) => (
        <div key={index} className="flex items-start space-x-3">
          <StatusBadge status={item.status} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-900">
              {new Date(item.changedAt).toLocaleString('ko-KR')}
            </div>
            {item.changedBy && (
              <div className="text-xs text-gray-500">
                변경자: {item.changedBy}
              </div>
            )}
            {item.note && (
              <div className="text-xs text-gray-600 mt-1">
                {item.note}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatusBadge;