/**
 * 커뮤니티 페이지네이션 공통 컴포넌트
 *
 * @description 표준화된 페이지네이션을 제공하는 공통 컴포넌트입니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import { StandardPagination } from '../../types';
import CustomSelect from './CustomSelect';

interface CommunityPaginationProps {
  pagination: StandardPagination;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
  showPageInfo?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export const CommunityPagination: React.FC<CommunityPaginationProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
  showPageInfo = true,
  showFirstLast = true,
  maxVisiblePages = 5,
  className = ''
}) => {
  const {
    current_page,
    total_pages,
    total_count,
    per_page,
    has_next,
    has_prev
  } = pagination;

  // 페이지 번호 버튼 생성
  const getVisiblePages = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];

    if (total_pages <= maxVisiblePages) {
      // 전체 페이지가 최대 표시 개수보다 적으면 모든 페이지 표시
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      const halfRange = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, current_page - halfRange);
      let endPage = Math.min(total_pages, current_page + halfRange);

      // 시작 페이지 조정
      if (endPage - startPage < maxVisiblePages - 1) {
        if (startPage === 1) {
          endPage = Math.min(total_pages, startPage + maxVisiblePages - 1);
        } else {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
      }

      // 첫 페이지와 ellipsis 추가
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('ellipsis');
        }
      }

      // 중간 페이지들 추가
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // 마지막 페이지와 ellipsis 추가
      if (endPage < total_pages) {
        if (endPage < total_pages - 1) {
          pages.push('ellipsis');
        }
        pages.push(total_pages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  // 페이지당 항목 수 옵션
  const limitOptions = [10, 20, 50, 100];

  if (total_pages <= 1 && !showPageInfo) {
    return null;
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* 왼쪽: 페이지 정보 */}
      {showPageInfo && (
        <div className="text-sm text-gray-600">
          <span>
            총 <span className="font-medium">{total_count.toLocaleString()}</span>개 항목 중{' '}
            <span className="font-medium">
              {((current_page - 1) * per_page + 1).toLocaleString()}-
              {Math.min(current_page * per_page, total_count).toLocaleString()}
            </span>번째 항목
          </span>
        </div>
      )}

      {/* 중앙: 페이지 버튼들 */}
      <div className="flex items-center space-x-1">
        {/* 첫 페이지 */}
        {showFirstLast && total_pages > maxVisiblePages && (
          <button
            onClick={() => onPageChange(1)}
            disabled={current_page === 1}
            className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="첫 페이지"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}

        {/* 이전 페이지 */}
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={!has_prev}
          className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="이전 페이지"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* 페이지 번호들 */}
        {visiblePages.map((page, index) => (
          <React.Fragment key={index}>
            {page === 'ellipsis' ? (
              <div className="px-3 py-2 text-gray-400">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            ) : (
              <button
                onClick={() => onPageChange(page)}
                className={`px-3 py-2 rounded-md border text-sm font-medium ${
                  page === current_page
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        {/* 다음 페이지 */}
        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={!has_next}
          className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          title="다음 페이지"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* 마지막 페이지 */}
        {showFirstLast && total_pages > maxVisiblePages && (
          <button
            onClick={() => onPageChange(total_pages)}
            disabled={current_page === total_pages}
            className="p-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="마지막 페이지"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 오른쪽: 페이지당 항목 수 선택 */}
      {showLimitSelector && onLimitChange && (
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">
            항목 수:
          </label>
          <CustomSelect
            options={limitOptions.map(option => ({
              value: option.toString(),
              label: `${option}개`
            }))}
            value={per_page.toString()}
            onChange={(value) => onLimitChange(Number(value))}
            className="min-w-[80px]"
          />
        </div>
      )}
    </div>
  );
};

/**
 * 간단한 페이지네이션 컴포넌트 (이전/다음만)
 */
export const SimplePagination: React.FC<{
  pagination: StandardPagination;
  onPageChange: (page: number) => void;
  className?: string;
}> = ({ pagination, onPageChange, className = '' }) => {
  const { current_page, has_next, has_prev } = pagination;

  return (
    <div className={`flex justify-center space-x-2 ${className}`}>
      <button
        onClick={() => onPageChange(current_page - 1)}
        disabled={!has_prev}
        className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        이전
      </button>
      <span className="px-4 py-2 text-sm text-gray-600">
        {current_page}페이지
      </span>
      <button
        onClick={() => onPageChange(current_page + 1)}
        disabled={!has_next}
        className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        다음
      </button>
    </div>
  );
};

/**
 * 로딩 상태 페이지네이션
 */
export const PaginationSkeleton: React.FC<{ className?: string }> = ({
  className = ''
}) => (
  <div className={`flex justify-center space-x-2 ${className}`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="w-10 h-10 bg-gray-200 rounded-md animate-pulse"
      />
    ))}
  </div>
);

export default CommunityPagination;