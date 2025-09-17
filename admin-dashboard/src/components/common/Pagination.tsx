import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50]
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="self-stretch flex justify-end items-center gap-2 px-4 py-3">
      <div className="flex justify-start items-center gap-8">
        {/* Rows per page */}
        <div className="flex justify-start items-center gap-2">
          <div className="justify-center text-gray-900 text-sm font-medium font-['Pretendard'] leading-tight">
            페이지당 항목 수
          </div>
          <div className="w-16 inline-flex flex-col justify-start items-start gap-2">
            <div className="relative w-full">
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="w-full h-9 px-3 pr-8 py-2 bg-white rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-gray-300 appearance-none text-gray-600 text-sm font-normal font-['Pretendard'] leading-tight cursor-pointer"
              >
                {itemsPerPageOptions.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Page info */}
        <div className="justify-center text-gray-900 text-sm font-medium font-['Pretendard'] leading-tight">
          {totalPages}페이지 중 {currentPage}페이지
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-start items-center gap-2">
          {/* First page */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`w-9 h-9 px-2 py-2 rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-gray-300 flex justify-center items-center ${
              currentPage === 1
                ? 'opacity-50 bg-white cursor-not-allowed'
                : 'bg-white hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <ChevronsLeft className="w-4 h-4 text-gray-900" />
          </button>

          {/* Previous page */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`w-9 h-9 px-2 py-2 rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-gray-300 flex justify-center items-center ${
              currentPage === 1
                ? 'opacity-50 bg-white cursor-not-allowed'
                : 'bg-white hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <ChevronLeft className="w-4 h-4 text-gray-900" />
          </button>

          {/* Next page */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`w-9 h-9 px-2 py-2 rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-gray-300 flex justify-center items-center ${
              currentPage === totalPages
                ? 'opacity-50 bg-white cursor-not-allowed'
                : 'bg-white hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <ChevronRight className="w-4 h-4 text-gray-900" />
          </button>

          {/* Last page */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`w-9 h-9 px-2 py-2 rounded-lg shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline outline-1 outline-offset-[-1px] outline-gray-300 flex justify-center items-center ${
              currentPage === totalPages
                ? 'opacity-50 bg-white cursor-not-allowed'
                : 'bg-white hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <ChevronsRight className="w-4 h-4 text-gray-900" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;