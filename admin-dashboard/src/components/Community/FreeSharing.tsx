import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MapPin,
  Eye,
  Heart,
  Image as ImageIcon,
  Gift,
} from 'lucide-react';
import { Button } from '../ui/button';
import { communityService, SharingItem } from '../../services/communityService';
import { formatCreatedAt } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass, getStatusFilterOptions } from '../../utils/status-mapping';

const FreeSharing: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // 나눔 게시글 데이터 (API에서 로드)
  const [sharingItems, setSharingItems] = useState<SharingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 제거됨: 모달 대신 별도 페이지 사용

  // 상세보기 모달 상태

  useEffect(() => {
    const fetchSharingItems = async () => {
      try {
        setLoading(true);
        const data = await communityService.getSharingItems({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          search: searchTerm || undefined,
          limit: 50
        });
        console.log('🎯 FreeSharing 컴포넌트에서 받은 데이터:', data);
        console.log('🎯 데이터 길이:', data.length);
        setSharingItems(data);
      } catch (error) {
        console.error('무료 나눔 데이터 로드 실패:', error);
        setSharingItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSharingItems();
  }, [selectedCategory, selectedStatus, searchTerm]);

  // 제거됨: 등록 기능은 별도 페이지로 이동

  const handleItemClick = (item: SharingItem) => {
    window.location.href = `/community/free-sharing/${item.id}`;
  };

  const categories = [
    { value: 'all', label: '전체' },
    { value: '가구', label: '가구' },
    { value: '전자제품', label: '전자제품' },
    { value: '도서', label: '도서' },
    { value: '악기', label: '악기' },
    { value: '기타', label: '기타' }
  ];

  // 마이그레이션 가이드: 표준 상태값 사용
  const statusOptions = getStatusFilterOptions();

  // 마이그레이션 가이드: 레거시 상태값을 표준 상태값으로 변환
  const getStandardStatus = (legacyStatus: string) => mapToStandardStatus(legacyStatus);
  const getStatusColor = (status: string) => getStatusClass(getStandardStatus(status));
  const getStatusText = (status: string) => getStatusLabel(getStandardStatus(status));

  const filteredItems = sharingItems.filter(item => {
    const matchesSearch = (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    // 마이그레이션 가이드: 레거시 상태값을 표준 상태값으로 변환하여 필터링
    const standardStatus = getStandardStatus(item.status || 'active');
    const matchesStatus = selectedStatus === 'all' || standardStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  console.log('🔍 loading 상태:', loading);
  console.log('🔍 sharingItems 상태:', sharingItems);
  console.log('🔍 sharingItems[0]:', sharingItems[0]);
  console.log('🔍 sharingItems[0]?.images:', sharingItems[0]?.images);
  console.log('🔍 filteredItems 결과:', filteredItems);
  console.log('🔍 filteredItems[0]:', filteredItems[0]);
  console.log('🔍 filteredItems[0]?.images:', filteredItems[0]?.images);
  console.log('🔍 filteredItems.length:', filteredItems.length);
  console.log('🔍 현재 필터 - 카테고리:', selectedCategory, '상태:', selectedStatus, '검색어:', searchTerm);

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end p-6 mb-4">
        <div className="flex-1 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">무료 나눔(드림)</h1>
          <p className="text-sm text-gray-600">사용하지 않는 물품을 다른 교회와 나누어요</p>
        </div>

        <div className="flex items-center gap-3">
          {/* 검색바 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* 필터 버튼 */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          {/* New 버튼 */}
          <Button
            onClick={() => window.location.href = '/community/free-sharing/create'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* 상태 선택 - 별도 필터 */}
      <div className="mb-4">
        <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
      </div>

      {/* 게시글 목록 */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-500">데이터를 불러오는 중...</span>
        </div>
      ) : (
        <>
        {/* 테이블/목록 뷰 */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상품
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    카테고리
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    교회명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지역
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조회수
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          {(item.images?.length || 0) > 0 ? (
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="h-16 w-16 rounded-lg object-cover"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center"><svg class="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg></div>';
                                }
                              }}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.userName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.church || '협력사'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {item.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCreatedAt(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {item.view_count}
                        </span>
                        <span className="flex items-center text-red-500">
                          <Heart className="h-3 w-3 mr-1" />
                          {item.likes}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* 데이터가 없을 때 */}
      {!loading && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            등록된 나눔 물품이 없습니다
          </h3>
          <p className="text-gray-600 mb-6">
            첫 번째 나눔 물품을 등록해보세요!
          </p>
          <Button
            onClick={() => window.location.href = '/community/free-sharing/create'}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="h-4 w-4" />
            나눔 등록하기
          </Button>
        </div>
      )}

    </div>
  );
};

export default FreeSharing;