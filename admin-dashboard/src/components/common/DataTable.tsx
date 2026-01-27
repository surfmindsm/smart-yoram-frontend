import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Spinner
} from '../ui';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';

// 정렬 순서 타입
export type SortOrder = 'asc' | 'desc';

// 컬럼 정의 타입
export interface Column<T> {
  id: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string; // Tailwind class like 'w-[100px]'
  align?: 'left' | 'center' | 'right';
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
  format?: (value: any, row: T) => React.ReactNode;
}

// 페이지네이션 정보
export interface PaginationInfo {
  page: number;
  rowsPerPage: number;
  totalCount: number;
}

// DataTable Props
export interface DataTableProps<T> {
  // 필수
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string | number);

  // 선택적
  loading?: boolean;
  onRowClick?: (row: T, index: number) => void;

  // 페이지네이션
  pagination?: boolean | PaginationInfo;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  rowsPerPageOptions?: number[];

  // 정렬
  sortable?: boolean;
  defaultSortBy?: string;
  defaultSortOrder?: SortOrder;
  onSortChange?: (sortBy: string, order: SortOrder) => void;

  // 스타일
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);

  // 빈 데이터
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;

  // 카드 래퍼
  card?: boolean;
  cardTitle?: string;
  cardDescription?: string;
  cardActions?: React.ReactNode;
}

function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  loading = false,
  onRowClick,

  pagination = false,
  onPageChange,
  onRowsPerPageChange,
  rowsPerPageOptions = [10, 25, 50, 100],

  sortable = true,
  defaultSortBy,
  defaultSortOrder = 'asc',
  onSortChange,

  className,
  headerClassName,
  rowClassName,

  emptyIcon,
  emptyMessage = '데이터가 없습니다.',

  card = true,
  cardTitle,
  cardDescription,
  cardActions,
}: DataTableProps<T>) {
  // 정렬 상태
  const [sortBy, setSortBy] = useState<string>(defaultSortBy || '');
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder);

  // 페이지네이션 상태
  const isPaginationEnabled = Boolean(pagination);
  const paginationInfo = typeof pagination === 'object' ? pagination : null;
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(rowsPerPageOptions[0]);

  const currentPage = paginationInfo?.page ?? internalPage;
  const currentRowsPerPage = paginationInfo?.rowsPerPage ?? internalRowsPerPage;
  const totalCount = paginationInfo?.totalCount ?? data.length;

  // Row Key 추출
  const getRowKey = (row: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return row[rowKey] ?? index;
  };

  // 정렬 핸들러
  const handleSort = (columnId: string) => {
    if (!sortable) return;

    const column = columns.find(col => col.id === columnId);
    if (column?.sortable === false) return;

    const newOrder: SortOrder = sortBy === columnId && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(columnId);
    setSortOrder(newOrder);

    if (onSortChange) {
      onSortChange(columnId, newOrder);
    }
  };

  // 클라이언트 사이드 정렬
  const sortedData = useMemo(() => {
    if (!sortBy || onSortChange) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [data, sortBy, sortOrder, onSortChange]);

  // 클라이언트 사이드 페이지네이션
  const paginatedData = useMemo(() => {
    if (!isPaginationEnabled || paginationInfo) return sortedData;

    const start = currentPage * currentRowsPerPage;
    return sortedData.slice(start, start + currentRowsPerPage);
  }, [sortedData, isPaginationEnabled, paginationInfo, currentPage, currentRowsPerPage]);

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  // 페이지당 행 수 변경
  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    if (onRowsPerPageChange) {
      onRowsPerPageChange(newRowsPerPage);
    } else {
      setInternalRowsPerPage(newRowsPerPage);
      setInternalPage(0);
    }
  };

  // 셀 값 렌더링
  const renderCell = (column: Column<T>, row: T, index: number) => {
    if (column.render) {
      return column.render(row, index);
    }

    const value = row[column.id as keyof T];

    if (column.format) {
      return column.format(value, row);
    }

    return value;
  };

  // 행 클래스명
  const getRowClassName = (row: T, index: number) => {
    const baseClass = 'transition-colors';
    const clickableClass = onRowClick ? 'cursor-pointer' : '';
    const customClass = typeof rowClassName === 'function'
      ? rowClassName(row, index)
      : rowClassName || '';

    return cn(baseClass, clickableClass, customClass);
  };

  // 정렬 아이콘
  const SortIcon = ({ columnId }: { columnId: string }) => {
    if (sortBy !== columnId) return null;

    return sortOrder === 'asc'
      ? <ChevronUp className="inline w-4 h-4 ml-1" />
      : <ChevronDown className="inline w-4 h-4 ml-1" />;
  };

  // 총 페이지 수
  const totalPages = Math.ceil(totalCount / currentRowsPerPage);

  // 테이블 콘텐츠
  const tableContent = (
    <>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="text-muted-foreground mt-4">로딩 중...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table className={className}>
              <TableHeader className={headerClassName}>
                <TableRow>
                  {columns.map((column) => {
                    const isSortable = sortable && column.sortable !== false;
                    const alignClass =
                      column.align === 'center' ? 'text-center' :
                      column.align === 'right' ? 'text-right' :
                      'text-left';

                    return (
                      <TableHead
                        key={String(column.id)}
                        className={cn(
                          column.width,
                          alignClass,
                          column.className,
                          isSortable && 'cursor-pointer select-none hover:bg-muted/50'
                        )}
                        onClick={() => isSortable && handleSort(String(column.id))}
                      >
                        <div className="flex items-center">
                          {column.label}
                          {isSortable && <SortIcon columnId={String(column.id)} />}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow
                    key={getRowKey(row, index)}
                    className={getRowClassName(row, index)}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {columns.map((column) => {
                      const alignClass =
                        column.align === 'center' ? 'text-center' :
                        column.align === 'right' ? 'text-right' :
                        '';

                      return (
                        <TableCell
                          key={String(column.id)}
                          className={cn(alignClass, column.className)}
                        >
                          {renderCell(column, row, index)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 페이지네이션 */}
          {isPaginationEnabled && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  페이지당 행:
                </p>
                <select
                  value={currentRowsPerPage}
                  onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                  className="border border-input rounded-md px-2 py-1 text-sm"
                >
                  {rowsPerPageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  {currentPage * currentRowsPerPage + 1}-
                  {Math.min((currentPage + 1) * currentRowsPerPage, totalCount)} /
                  총 {totalCount}
                </p>

                <div className="flex space-x-1">
                  <button
                    onClick={() => handlePageChange(0)}
                    disabled={currentPage === 0}
                    className="px-2 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                  >
                    {'<<'}
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-2 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                  >
                    {'<'}
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-2 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                  >
                    {'>'}
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="px-2 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                  >
                    {'>>'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  // Card로 감싸기
  if (card) {
    return (
      <Card className="border-muted">
        {(cardTitle || cardDescription || cardActions) && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                {cardTitle && <CardTitle>{cardTitle}</CardTitle>}
                {cardDescription && (
                  <p className="text-sm text-muted-foreground mt-1">{cardDescription}</p>
                )}
              </div>
              {cardActions && <div>{cardActions}</div>}
            </div>
          </CardHeader>
        )}
        <CardContent className={cardTitle || cardDescription || cardActions ? 'pt-0' : ''}>
          {tableContent}
        </CardContent>
      </Card>
    );
  }

  // Card 없이
  return <div>{tableContent}</div>;
}

export default DataTable;
