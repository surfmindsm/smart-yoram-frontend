import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Label } from './ui/label';

interface AnnouncementCategory {
  label: string;
  description: string;
  subcategories: Record<string, string>;
}

interface AnnouncementCategories {
  worship: AnnouncementCategory;
  member_news: AnnouncementCategory;
  event: AnnouncementCategory;
}

const CATEGORIES: AnnouncementCategories = {
  worship: {
    label: '예배/모임',
    description: '예배, 각종 모임, 주요 일정',
    subcategories: {
      sunday_worship: '주일예배',
      wednesday_worship: '수요예배',
      dawn_prayer: '새벽기도',
      special_worship: '특별예배',
      group_meeting: '구역/속회 모임',
      committee_meeting: '위원회 모임',
      schedule: '주요 일정',
    },
  },
  member_news: {
    label: '교우 소식',
    description: '부고, 결혼, 출산, 이사, 입원 등',
    subcategories: {
      obituary: '부고',
      wedding: '결혼',
      birth: '출산',
      relocation: '이사',
      hospitalization: '입원',
      celebration: '축하',
      other: '기타',
    },
  },
  event: {
    label: '행사/공지',
    description: '행사, 봉사, 알림, 일반 공지',
    subcategories: {
      church_event: '교회 행사',
      volunteer: '봉사 활동',
      education: '교육/세미나',
      registration: '등록/신청',
      facility: '시설 관련',
      notice: '일반 공지',
      emergency: '긴급 공지',
    },
  },
};

interface CategorySelectProps {
  category: string;
  subcategory?: string;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({
  category,
  subcategory,
  onCategoryChange,
  onSubcategoryChange,
}) => {
  const handleCategoryChange = (value: string) => {
    onCategoryChange(value);
    if (onSubcategoryChange) {
      onSubcategoryChange(''); // Reset subcategory when category changes
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="category">카테고리</Label>
        <Select value={category} onValueChange={handleCategoryChange}>
          <SelectTrigger id="category">
            <SelectValue placeholder="카테고리를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORIES).map(([key, cat]) => (
              <SelectItem key={key} value={key}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category && CATEGORIES[category as keyof AnnouncementCategories] && (
        <div>
          <Label htmlFor="subcategory">세부 카테고리</Label>
          <Select value={subcategory || undefined} onValueChange={onSubcategoryChange}>
            <SelectTrigger id="subcategory">
              <SelectValue placeholder="세부 카테고리를 선택하세요 (선택사항)" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(
                CATEGORIES[category as keyof AnnouncementCategories].subcategories
              ).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

interface CategoryBadgeProps {
  category: string;
  subcategory?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  subcategory,
}) => {
  const cat = CATEGORIES[category as keyof AnnouncementCategories];
  if (!cat) return null;

  const subcategoryLabel = subcategory && cat.subcategories[subcategory];

  return (
    <div className="inline-flex items-center gap-1">
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {cat.label}
      </span>
      {subcategoryLabel && (
        <>
          <span className="text-gray-400">›</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {subcategoryLabel}
          </span>
        </>
      )}
    </div>
  );
};

export { CATEGORIES };
export type { AnnouncementCategories, AnnouncementCategory };