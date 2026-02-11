import React from 'react';
import { Settings, X, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from '../ui';
import { Button } from '../ui';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';

export interface FilterOption {
  value: string;
  label: string;
}

export interface Filter {
  id: string;
  label: string;
  value: string[];
  options: FilterOption[];
  onChange: (value: string[]) => void;
}

export interface SearchFilterBarProps {
  // 검색 관련
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  searchPlaceholder?: string;
  searchDisabled?: boolean;

  // 상세검색 관련
  isAdvancedSearchActive?: boolean;
  onAdvancedSearchClick?: () => void;
  onAdvancedSearchClear?: () => void;
  showAdvancedSearch?: boolean;

  // 필터 관련
  filters?: Filter[];

  // 전체 개수
  totalCount?: number;
  totalLabel?: string;

  // 키보드 이벤트
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  onClearSearch,
  searchPlaceholder = '검색',
  searchDisabled = false,
  isAdvancedSearchActive = false,
  onAdvancedSearchClick,
  onAdvancedSearchClear,
  showAdvancedSearch = false,
  filters = [],
  totalCount,
  totalLabel = '전체',
  onKeyPress,
}) => {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* 검색 Input */}
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={onKeyPress}
          className="w-full md:w-[400px]"
          disabled={searchDisabled}
        />

        {/* 전체보기 버튼 */}
        {searchTerm && !isAdvancedSearchActive && (
          <Button
            onClick={onClearSearch}
            variant="outline"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            전체보기
          </Button>
        )}

        {/* 상세검색 버튼 */}
        {showAdvancedSearch && onAdvancedSearchClick && (
          <div
            className={cn(
              "inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer bg-white",
              isAdvancedSearchActive && "border-blue-300 text-blue-700"
            )}
          >
            <div
              onClick={onAdvancedSearchClick}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm">상세검색</span>
            </div>
            {isAdvancedSearchActive && onAdvancedSearchClear && (
              <X
                className="w-4 h-4 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdvancedSearchClear();
                }}
              />
            )}
          </div>
        )}

        {/* 동적 필터 */}
        {filters.map((filter) => (
          <Popover key={filter.id}>
            <div
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer bg-white",
                filter.value.length > 0 && "border-blue-300 text-blue-700"
              )}
            >
              <PopoverTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm">{filter.label}</span>
                  {filter.value.length === 0 && (
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  )}
                </div>
              </PopoverTrigger>
              {filter.value.length > 0 && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    filter.onChange([]);
                  }}
                />
              )}
            </div>
            <PopoverContent className="w-[200px] p-3" align="start">
              <div className="space-y-2">
                {filter.options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${filter.id}-${option.value}`}
                      checked={filter.value.includes(option.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          filter.onChange([...filter.value, option.value]);
                        } else {
                          filter.onChange(
                            filter.value.filter((v) => v !== option.value)
                          );
                        }
                      }}
                    />
                    <label
                      htmlFor={`${filter.id}-${option.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ))}
      </div>

      {/* 전체 개수 표시 */}
      {totalCount !== undefined && (
        <div className="flex justify-end items-center border-t border-gray-200 pt-4">
          <div className="text-sm text-gray-600">
            {totalLabel} {totalCount.toLocaleString()}명
          </div>
        </div>
      )}
    </div>
  );
};
