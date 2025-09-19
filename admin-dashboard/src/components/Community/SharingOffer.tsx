import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  MapPin,
  Share2,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../ui/button';
import { CommunityTable, TableColumn, TableRenderers } from '../common/CommunityTable';
import CustomSelect, { SelectOption } from '../common/CustomSelect';
import { communityService, OfferItem } from '../../services/communityService';
import { getCreatePagePath } from './postConfigs';
import { formatCreatedAt } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass } from '../../utils/status-mapping';


const SharingOffer: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // 조회수 증가 함수 (전용 API 사용)
  const incrementViewCount = async (itemId: number) => {
    try {
      const response = await fetch(`https://api.surfmind-team.com/api/v1/community/item-sale/${itemId}/increment-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📈 나눔제공 조회수 증가: ${data.data?.previous_view_count || 'unknown'} → ${data.data?.new_view_count || 'unknown'}`);
        return data.data?.new_view_count;
      }
    } catch (error) {
      console.error('나눔제공 조회수 증가 실패:', error);
    }
  };

  // 상세 페이지로 이동하는 함수
  const handleItemClick = async (item: OfferItem) => {
    // 조회수 증가 (백그라운드에서 실행)
    const newViewCount = await incrementViewCount(item.id);

    // 목록에서 해당 아이템의 조회수 업데이트
    if (newViewCount) {
      setOfferItems(prevItems =>
        prevItems?.map(prevItem =>
          prevItem.id === item.id
            ? { ...prevItem, view_count: newViewCount }
            : prevItem
        ) || []
      );
    }

    // 상세 페이지로 이동
    navigate(`/community/item-sale/${item.id}`);
  };
  // 물품 판매 데이터 (API에서 로드)
  const [offerItems, setOfferItems] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);

  const categories: SelectOption[] = [
    { value: 'all', label: '전체' },
    { value: '가구', label: '가구' },
    { value: '전자제품', label: '전자제품' },
    { value: '도서', label: '도서' },
    { value: '악기', label: '악기' },
    { value: '기타', label: '기타' }
  ];

  // 단순화된 상태 옵션 - 판매중/판매완료만
  const statusOptions: SelectOption[] = [
    { value: 'all', label: '전체 상태' },
    { value: 'sharing', label: '판매중' },
    { value: 'completed', label: '판매완료' }
  ];

  // 물품 판매 전용 상태 매핑
  const getSaleStatusLabel = (status: string): string => {
    const itemStatus = status as string; // 타입 확장
    switch (itemStatus) {
      case 'sharing':
        return '판매중';
      case 'completed':
        return '판매완료';
      // 기존 상태값 호환성 (점진적 마이그레이션)
      case 'active':
      case 'available':
      case 'open':
        return '판매중';
      case 'closed':
      case 'inactive':
      case 'reserved':
        return '판매완료';
      default:
        return '판매중'; // 기본값은 판매중으로
    }
  };

  const getSaleStatusClass = (status: string): string => {
    const itemStatus = status as string; // 타입 확장
    switch (itemStatus) {
      case 'sharing':
      case 'active':
      case 'available':
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
      case 'closed':
      case 'inactive':
      case 'reserved':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800'; // 기본값은 판매중 색상으로
    }
  };

  const columns: TableColumn[] = [
    {
      key: 'title',
      title: '제목',
      render: (_, item) => TableRenderers.titleWithImage(
        item.title,
        item.images?.[0],
        <ImageIcon className="h-6 w-6 text-gray-400" />
      )
    },
    {
      key: 'category',
      title: '카테고리',
      render: (value) => TableRenderers.badge(value)
    },
    {
      key: 'price',
      title: '가격',
      render: (value) => TableRenderers.price(value)
    },
    {
      key: 'location',
      title: '지역',
      render: (value) => TableRenderers.location(value, <MapPin className="h-3 w-3 mr-1" />)
    },
    {
      key: 'status',
      title: '상태',
      render: (value) => TableRenderers.badge(
        getSaleStatusLabel(value),
        getSaleStatusClass(value)
      )
    },
    {
      key: 'church',
      title: '교회명',
      render: (value) => TableRenderers.church(value)
    },
    {
      key: 'userName',
      title: '작성자',
      render: (value) => TableRenderers.user(value)
    },
    {
      key: 'createdAt',
      title: '등록일',
      render: (value) => TableRenderers.date(formatCreatedAt(value))
    },
    {
      key: 'view_count',
      title: '조회수',
      render: (value) => TableRenderers.viewCount(value)
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await communityService.getOfferItems({
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          search: searchTerm || undefined,
          limit: 50
        });
        console.log('🎯 SharingOffer 컴포넌트에서 받은 데이터:', data);
        console.log('🎯 첫 번째 아이템 상세:', data[0]);

        // 물품 판매 상태 필터링
        const filteredData = data.filter((item: any) => {
          const itemStatus = item.status as string; // 타입 확장
          const normalizedStatus = itemStatus === 'active' || itemStatus === 'available' || itemStatus === 'open'
            ? 'sharing'
            : itemStatus === 'closed' || itemStatus === 'inactive' || itemStatus === 'completed' || itemStatus === 'reserved'
            ? 'completed'
            : itemStatus;
          const matchesStatus = selectedStatus === 'all' || normalizedStatus === selectedStatus;
          return matchesStatus;
        });

        setOfferItems(filteredData);
      } catch (error) {
        console.error('SharingOffer 데이터 로드 실패:', error);
        setOfferItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, selectedStatus, searchTerm]);

  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end pr-6 mb-4">
        <div className="flex-1 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">물품 판매</h1>
          <p className="text-sm text-gray-600">다른 교회와 물품을 거래해보세요</p>
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


          {/* New 버튼 */}
          <Button
            onClick={() => navigate(getCreatePagePath('item-sale'))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* 필터들 */}
      <div className="mb-4 flex gap-4">
        {/* 카테고리 선택 */}
        <CustomSelect
          options={categories}
          value={selectedCategory}
          onChange={setSelectedCategory}
          className="w-auto"
        />

        {/* 상태 선택 */}
        <CustomSelect
          options={statusOptions}
          value={selectedStatus}
          onChange={setSelectedStatus}
          className="w-auto"
        />
      </div>

      <CommunityTable
        columns={columns}
        data={offerItems || []}
        loading={loading}
        onRowClick={handleItemClick}
        emptyMessage="검색 결과가 없습니다"
        emptyIcon={<Share2 className="h-12 w-12 text-gray-400" />}
        selectable={false}
      />

    </div>
  );
};

export default SharingOffer;