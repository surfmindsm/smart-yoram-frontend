/**
 * 커뮤니티 공유/판매 API 서비스
 *
 * @description 무료 나눔, 물품 요청, 물품 판매 관련 API 함수들을 제공합니다.
 * @version 2.0.0
 * @since 2025-09-15
 */

import { CommunityAPI } from './community-common';
import {
  SharingItem,
  RequestItem,
  OfferItem,
  CreateSharingItemDTO,
  CreateRequestItemDTO,
  CreateOfferItemDTO,
  UpdateSharingItemDTO,
  UpdateRequestItemDTO,
  UpdateOfferItemDTO,
  SharingFilterOptions,
  RequestFilterOptions,
  ApiRequestOptions,
  StandardListResponse,
  StandardSingleResponse,
  SharingCategory
} from '../types';

/**
 * 무료 나눔 API 서비스
 */
export class SharingAPI {
  /**
   * 무료 나눔 목록 조회
   */
  static async getList(
    options: ApiRequestOptions & SharingFilterOptions = {}
  ): Promise<StandardListResponse<SharingItem>> {
    return CommunityAPI.getList<SharingItem>('sharing', options);
  }

  /**
   * 무료 나눔 상세 조회
   */
  static async getDetail(id: number): Promise<StandardSingleResponse<SharingItem>> {
    return CommunityAPI.getDetail<SharingItem>('sharing', id);
  }

  /**
   * 무료 나눔 등록
   */
  static async create(data: CreateSharingItemDTO): Promise<StandardSingleResponse<SharingItem>> {
    return CommunityAPI.create<SharingItem>('sharing', data);
  }

  /**
   * 무료 나눔 수정
   */
  static async update(
    id: number,
    data: UpdateSharingItemDTO
  ): Promise<StandardSingleResponse<SharingItem>> {
    return CommunityAPI.update<SharingItem>('sharing', id, data);
  }

  /**
   * 무료 나눔 삭제
   */
  static async delete(id: number): Promise<void> {
    return CommunityAPI.delete('sharing', id);
  }

  /**
   * 무료 나눔 좋아요
   */
  static async toggleLike(id: number): Promise<{ liked: boolean; likes: number }> {
    return CommunityAPI.toggleLike('sharing', id);
  }

  /**
   * 무료 나눔 조회수 증가
   */
  static async incrementView(id: number): Promise<{ view_count: number }> {
    return CommunityAPI.incrementView('sharing', id);
  }

  /**
   * 무료 나눔 검색
   */
  static async search(
    query: string,
    options: Omit<ApiRequestOptions & SharingFilterOptions, 'search'> = {}
  ): Promise<StandardListResponse<SharingItem>> {
    return CommunityAPI.search<SharingItem>('sharing', query, options);
  }

  /**
   * 카테고리별 무료 나눔 조회
   */
  static async getByCategory(
    category: SharingCategory | 'all',
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<SharingItem>> {
    return this.getList({ ...options, category });
  }

  /**
   * 내가 등록한 무료 나눔 조회
   */
  static async getMyItems(
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<SharingItem>> {
    return CommunityAPI.getMyPosts<SharingItem>('sharing', options);
  }
}

/**
 * 물품 요청 API 서비스
 */
export class RequestAPI {
  /**
   * 물품 요청 목록 조회
   */
  static async getList(
    options: ApiRequestOptions & RequestFilterOptions = {}
  ): Promise<StandardListResponse<RequestItem>> {
    return CommunityAPI.getList<RequestItem>('request', options);
  }

  /**
   * 물품 요청 상세 조회
   */
  static async getDetail(id: number): Promise<StandardSingleResponse<RequestItem>> {
    return CommunityAPI.getDetail<RequestItem>('request', id);
  }

  /**
   * 물품 요청 등록
   */
  static async create(data: CreateRequestItemDTO): Promise<StandardSingleResponse<RequestItem>> {
    return CommunityAPI.create<RequestItem>('request', data);
  }

  /**
   * 물품 요청 수정
   */
  static async update(
    id: number,
    data: UpdateRequestItemDTO
  ): Promise<StandardSingleResponse<RequestItem>> {
    return CommunityAPI.update<RequestItem>('request', id, data);
  }

  /**
   * 물품 요청 삭제
   */
  static async delete(id: number): Promise<void> {
    return CommunityAPI.delete('request', id);
  }

  /**
   * 물품 요청 좋아요
   */
  static async toggleLike(id: number): Promise<{ liked: boolean; likes: number }> {
    return CommunityAPI.toggleLike('request', id);
  }

  /**
   * 물품 요청 조회수 증가
   */
  static async incrementView(id: number): Promise<{ view_count: number }> {
    return CommunityAPI.incrementView('request', id);
  }

  /**
   * 물품 요청 검색
   */
  static async search(
    query: string,
    options: Omit<ApiRequestOptions & RequestFilterOptions, 'search'> = {}
  ): Promise<StandardListResponse<RequestItem>> {
    return CommunityAPI.search<RequestItem>('request', query, options);
  }

  /**
   * 긴급도별 물품 요청 조회
   */
  static async getByUrgency(
    urgency: string,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<RequestItem>> {
    return this.getList({ ...options, urgency } as any);
  }

  /**
   * 내가 등록한 물품 요청 조회
   */
  static async getMyRequests(
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<RequestItem>> {
    return CommunityAPI.getMyPosts<RequestItem>('request', options);
  }
}

/**
 * 물품 판매 API 서비스
 */
export class OfferAPI {
  /**
   * 물품 판매 목록 조회
   */
  static async getList(
    options: ApiRequestOptions & SharingFilterOptions = {}
  ): Promise<StandardListResponse<OfferItem>> {
    return CommunityAPI.getList<OfferItem>('offer', options);
  }

  /**
   * 물품 판매 상세 조회
   */
  static async getDetail(id: number): Promise<StandardSingleResponse<OfferItem>> {
    return CommunityAPI.getDetail<OfferItem>('offer', id);
  }

  /**
   * 물품 판매 등록
   */
  static async create(data: CreateOfferItemDTO): Promise<StandardSingleResponse<OfferItem>> {
    return CommunityAPI.create<OfferItem>('offer', data);
  }

  /**
   * 물품 판매 수정
   */
  static async update(
    id: number,
    data: UpdateOfferItemDTO
  ): Promise<StandardSingleResponse<OfferItem>> {
    return CommunityAPI.update<OfferItem>('offer', id, data);
  }

  /**
   * 물품 판매 삭제
   */
  static async delete(id: number): Promise<void> {
    return CommunityAPI.delete('offer', id);
  }

  /**
   * 물품 판매 좋아요
   */
  static async toggleLike(id: number): Promise<{ liked: boolean; likes: number }> {
    return CommunityAPI.toggleLike('offer', id);
  }

  /**
   * 물품 판매 조회수 증가
   */
  static async incrementView(id: number): Promise<{ view_count: number }> {
    return CommunityAPI.incrementView('offer', id);
  }

  /**
   * 물품 판매 검색
   */
  static async search(
    query: string,
    options: Omit<ApiRequestOptions, 'search'> = {}
  ): Promise<StandardListResponse<OfferItem>> {
    return CommunityAPI.search<OfferItem>('offer', query, options);
  }

  /**
   * 가격대별 물품 판매 조회
   */
  static async getByPriceRange(
    priceMin: number,
    priceMax: number,
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<OfferItem>> {
    return this.getList({ ...options, price_min: priceMin, price_max: priceMax } as any);
  }

  /**
   * 내가 등록한 물품 판매 조회
   */
  static async getMyOffers(
    options: ApiRequestOptions = {}
  ): Promise<StandardListResponse<OfferItem>> {
    return CommunityAPI.getMyPosts<OfferItem>('offer', options);
  }
}

/**
 * 통합 공유/판매 API 서비스
 */
export class SharingIntegratedAPI {
  // 개별 API 서비스들을 속성으로 노출
  static sharing = SharingAPI;
  static request = RequestAPI;
  static offer = OfferAPI;

  /**
   * 전체 공유/판매 통계 조회
   */
  static async getStatistics(): Promise<{
    total_sharing: number;
    total_requests: number;
    total_offers: number;
    active_sharing: number;
    active_requests: number;
    active_offers: number;
  }> {
    try {
      const [sharingStats, requestStats, offerStats] = await Promise.all([
        SharingAPI.getList({ limit: 1 }),
        RequestAPI.getList({ limit: 1 }),
        OfferAPI.getList({ limit: 1 })
      ]);

      return {
        total_sharing: sharingStats.pagination.total_count,
        total_requests: requestStats.pagination.total_count,
        total_offers: offerStats.pagination.total_count,
        active_sharing: sharingStats.pagination.total_count, // 임시
        active_requests: requestStats.pagination.total_count, // 임시
        active_offers: offerStats.pagination.total_count // 임시
      };
    } catch (error) {
      console.error('공유/판매 통계 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 전체 검색 (공유, 요청, 판매 통합)
   */
  static async searchAll(
    query: string,
    options: ApiRequestOptions = {}
  ): Promise<{
    sharing: StandardListResponse<SharingItem>;
    requests: StandardListResponse<RequestItem>;
    offers: StandardListResponse<OfferItem>;
  }> {
    try {
      const { category, ...baseOptions } = options;
      const [sharing, requests, offers] = await Promise.all([
        SharingAPI.search(query, baseOptions),
        RequestAPI.search(query, baseOptions),
        OfferAPI.search(query, baseOptions)
      ]);

      return { sharing, requests, offers };
    } catch (error) {
      console.error('통합 검색 실패:', error);
      throw error;
    }
  }
}