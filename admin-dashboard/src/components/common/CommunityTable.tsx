import React, { useState } from 'react';
import { Eye } from 'lucide-react';
import { Pagination } from './Pagination';

export interface TableColumn {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, item: any, index: number) => React.ReactNode;
}

export interface CommunityTableProps {
  columns: TableColumn[];
  data: any[];
  loading?: boolean;
  onRowClick?: (item: any) => void;
  className?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  selectable?: boolean;
  onSelectionChange?: (selectedItems: any[]) => void;
  defaultItemsPerPage?: number;
  itemsPerPageOptions?: number[];
}

export const CommunityTable: React.FC<CommunityTableProps> = ({
  columns,
  data,
  loading = false,
  onRowClick,
  className = '',
  emptyMessage = '데이터가 없습니다',
  emptyIcon,
  selectable = false,
  onSelectionChange,
  defaultItemsPerPage = 10,
  itemsPerPageOptions = [5, 10, 20, 50]
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<any>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection = new Set(data);
      setSelectedItems(newSelection);
      onSelectionChange?.(Array.from(newSelection));
    } else {
      setSelectedItems(new Set());
      onSelectionChange?.([]);
    }
  };

  const handleSelectItem = (item: any, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(item);
    } else {
      newSelection.delete(item);
    }
    setSelectedItems(newSelection);
    onSelectionChange?.(Array.from(newSelection));
  };

  const isAllSelected = data.length > 0 && selectedItems.size === data.length;
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < data.length;

  // Pagination logic
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-500">데이터를 불러오는 중...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        {emptyIcon && <div className="flex justify-center mb-4">{emptyIcon}</div>}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {emptyMessage}
        </h3>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Table with outline styling */}
      <div className="overflow-hidden rounded-lg">
        <table className="w-full outline outline-1 outline-offset-[-1px] outline-gray-300 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              {selectable && (
                <th className="w-12 px-4 py-3 text-left border-b border-gray-300">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-300"
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white">
            {paginatedData.map((item, index) => (
              <tr
                key={item.id || index}
                className={`border-b border-gray-300 ${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {selectable && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item)}
                      onChange={(e) => handleSelectItem(item, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm">
                    {column.render
                      ? column.render(item[column.key], item, index)
                      : item[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={data.length}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemsPerPageOptions={itemsPerPageOptions}
        />
      )}
    </div>
  );
};

// 공통으로 사용할 렌더링 함수들
export const TableRenderers = {
  // 배지 렌더러
  badge: (text: string, colorClass: string = 'bg-purple-100 text-purple-800') => (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {text}
    </span>
  ),

  // 조회수 렌더러
  viewCount: (count: number | string) => (
    <span className="flex items-center text-sm text-gray-500">
      <Eye className="h-4 w-4 mr-1" />
      {count || 0}
    </span>
  ),

  // 위치 렌더러 (MapPin 아이콘 포함)
  location: (location: string, icon?: React.ReactNode) => (
    <div className="flex items-center text-sm text-gray-500">
      {icon}
      {location}
    </div>
  ),

  // 이미지 + 제목 렌더러
  titleWithImage: (title: string, imageUrl?: string, fallbackIcon?: React.ReactNode) => (
    <div className="flex items-center">
      <div className="flex-shrink-0 h-16 w-16">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-16 w-16 rounded-lg object-cover"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && fallbackIcon) {
                parent.innerHTML = `<div class="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">${fallbackIcon}</div>`;
              }
            }}
          />
        ) : (
          <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
            {fallbackIcon}
          </div>
        )}
      </div>
      <div className="ml-4">
        <div className="text-sm font-medium text-gray-900">{title}</div>
      </div>
    </div>
  ),

  // 제목만 렌더러
  title: (title: string) => (
    <div className="text-sm font-medium text-gray-900">{title}</div>
  ),

  // 가격 렌더러
  price: (price: number | string, isFree: boolean = false) => (
    <span className="text-sm font-medium text-gray-900">
      {isFree ? '무료' : price ? `₩${Number(price).toLocaleString()}` : '가격 문의'}
    </span>
  ),

  // 날짜 렌더러
  date: (dateString: string, formatter?: (date: string) => string) => (
    <span className="text-sm text-gray-500">
      {formatter ? formatter(dateString) : dateString}
    </span>
  ),

  // 사용자명 렌더러
  user: (userName: string, fallback: string = '익명') => (
    <span className="text-sm text-gray-900">{userName || fallback}</span>
  ),

  // 교회명 렌더러
  church: (churchName: string, fallback: string = '협력사') => (
    <span className="text-sm text-gray-900">{churchName || fallback}</span>
  )
};

export default CommunityTable;