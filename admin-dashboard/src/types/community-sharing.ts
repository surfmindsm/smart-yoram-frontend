/**
 * 커뮤니티 공유/판매 관련 타입 정의
 *
 * @description 무료 나눔, 물품 요청, 물품 판매 관련 타입들을 정의합니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

import {
  CommunityBasePost,
  ContactInfo,
  LocationInfo,
  ImageInfo,
  CategoryInfo,
  CommunityStatus
} from './community-common';

// 무료 나눔 인터페이스
export interface SharingItem extends CommunityBasePost, ContactInfo, LocationInfo, ImageInfo, CategoryInfo {
  condition: string;
  quantity: number;
  is_free: boolean;
  delivery_method?: string;
  pickup_location?: string;
}

// 물품 요청 인터페이스
export interface RequestItem extends CommunityBasePost, ContactInfo, LocationInfo, CategoryInfo {
  requested_item: string;
  quantity: number;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'normal';
  needed_date?: string;
  max_budget?: number;
  preferred_condition?: string;
}

// 물품 판매 인터페이스
export interface OfferItem extends CommunityBasePost, ContactInfo, LocationInfo, ImageInfo, CategoryInfo {
  item_name: string;
  condition: string;
  quantity: number;
  price?: number;
  delivery_method: string;
  negotiable: boolean;
  warranty_info?: string;
  purchase_date?: string;
}

// 공유/판매 상태 타입
export type SharingStatus = Extract<CommunityStatus, 'active' | 'completed' | 'cancelled'>;

// 물품 상태 타입
export type ItemCondition = '새상품' | '거의 새것' | '양호' | '사용감 있음' | '고장/수리필요';

// 배송/수령 방법 타입
export type DeliveryMethod = '직거래' | '택배발송' | '픽업' | '협의';

// 긴급도 타입
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'normal';

// 카테고리 타입
export type SharingCategory = '전자제품' | '가구' | '도서' | '의류' | '생활용품' | '스포츠' | '취미' | '기타';

// 필터 옵션 (공유/판매 특화)
export interface SharingFilterOptions {
  category?: SharingCategory | 'all';
  condition?: ItemCondition | 'all';
  price_min?: number;
  price_max?: number;
  is_free?: boolean;
  delivery_method?: DeliveryMethod | 'all';
  location?: string;
}

// 요청 필터 옵션
export interface RequestFilterOptions {
  category?: SharingCategory | 'all';
  urgency?: UrgencyLevel | 'all';
  budget_max?: number;
  needed_date_from?: string;
  needed_date_to?: string;
}

// 생성/수정용 DTO 타입들
export interface CreateSharingItemDTO {
  title: string;
  description: string;
  category: SharingCategory;
  condition: ItemCondition;
  quantity: number;
  location: string;
  contact_phone: string;
  contact_email?: string;
  images?: string[];
  delivery_method?: DeliveryMethod;
}

export interface CreateRequestItemDTO {
  title: string;
  description: string;
  category: SharingCategory;
  requested_item: string;
  quantity: number;
  reason: string;
  urgency: UrgencyLevel;
  location: string;
  contact_phone: string;
  contact_email?: string;
  needed_date?: string;
  max_budget?: number;
}

export interface CreateOfferItemDTO {
  title: string;
  description: string;
  category: SharingCategory;
  item_name: string;
  condition: ItemCondition;
  quantity: number;
  price?: number;
  delivery_method: DeliveryMethod;
  location: string;
  contact_phone: string;
  contact_email?: string;
  images?: string[];
  negotiable?: boolean;
}

// 업데이트용 DTO 타입들 (Partial)
export type UpdateSharingItemDTO = Partial<CreateSharingItemDTO>;
export type UpdateRequestItemDTO = Partial<CreateRequestItemDTO>;
export type UpdateOfferItemDTO = Partial<CreateOfferItemDTO>;