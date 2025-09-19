import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  MapPin,
  Image as ImageIcon,
  Gift
} from 'lucide-react';
import { Button } from '../ui/button';
import { CommunityTable, TableColumn, TableRenderers } from '../common/CommunityTable';
import { communityService, SharingItem } from '../../services/communityService';
import { formatCreatedAt } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass, getStatusFilterOptions } from '../../utils/status-mapping';
import CustomSelect, { SelectOption } from '../common/CustomSelect';

const FreeSharing: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

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
        console.log('🔢 조회수 데이터 확인:', data.map(item => `${item.title}: ${item.view_count}회`));
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

  // 조회수 증가 함수 (전용 API 사용)
  const incrementViewCount = async (itemId: number) => {
    try {
      const response = await fetch(`https://api.surfmind-team.com/api/v1/community/sharing/${itemId}/increment-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📈 조회수 증가: ${data.data?.previous_view_count || 'unknown'} → ${data.data?.new_view_count || 'unknown'}`);
        return data.data?.new_view_count;
      }
    } catch (error) {
      console.error('조회수 증가 실패:', error);
    }
  };

  const handleItemClick = async (item: SharingItem) => {
    // 조회수 증가 (백그라운드에서 실행)
    const newViewCount = await incrementViewCount(item.id);

    // 목록에서 해당 아이템의 조회수 업데이트
    if (newViewCount) {
      setSharingItems(prevItems =>
        prevItems.map(prevItem =>
          prevItem.id === item.id
            ? { ...prevItem, view_count: newViewCount }
            : prevItem
        )
      );
    }

    // 상세 페이지로 이동
    window.location.href = `/community/free-sharing/${item.id}`;
  };

  const categories: SelectOption[] = [
    { value: 'all', label: '전체' },
    { value: '가구', label: '가구' },
    { value: '전자제품', label: '전자제품' },
    { value: '도서', label: '도서' },
    { value: '악기', label: '악기' },
    { value: '기타', label: '기타' }
  ];

  // 단순화된 상태 옵션 - 나눔중/나눔완료만
  const statusOptions: SelectOption[] = [
    { value: 'all', label: '전체 상태' },
    { value: 'sharing', label: '나눔중' },
    { value: 'completed', label: '나눔완료' }
  ];

  // 무료 나눔 전용 상태 매핑
  const getFreeSharingStatusLabel = (status: string): string => {
    const itemStatus = status as string; // 타입 확장
    switch (itemStatus) {
      case 'sharing':
        return '나눔중';
      case 'completed':
        return '나눔완료';
      // 기존 상태값 호환성 (점진적 마이그레이션)
      case 'active':
      case 'available':
      case 'open':
        return '나눔중';
      case 'closed':
      case 'inactive':
      case 'reserved':
        return '나눔완료';
      default:
        return '나눔중'; // 기본값은 나눔중으로
    }
  };

  const getFreeSharingStatusClass = (status: string): string => {
    const itemStatus = status as string; // 타입 확장
    switch (itemStatus) {
      case 'sharing':
      case 'active':
      case 'available':
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'completed':
      case 'closed':
      case 'inactive':
      case 'reserved':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-green-100 text-green-800'; // 기본값은 나눔중 색상으로
    }
  };

  const filteredItems = sharingItems.filter(item => {
    const matchesSearch = (item.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (item.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    // 무료 나눔 상태 필터링
    const itemStatus = item.status as string; // 타입 확장
    const normalizedStatus = itemStatus === 'active' || itemStatus === 'available' || itemStatus === 'open'
      ? 'sharing'
      : itemStatus === 'closed' || itemStatus === 'inactive' || itemStatus === 'completed'
      ? 'completed'
      : itemStatus;
    const matchesStatus = selectedStatus === 'all' || normalizedStatus === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

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
      render: () => TableRenderers.price(0, true)
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
        getFreeSharingStatusLabel(value),
        getFreeSharingStatusClass(value)
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


  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end pr-6 mb-4">
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
        data={filteredItems}
        loading={loading}
        onRowClick={handleItemClick}
        emptyMessage="등록된 나눔 물품이 없습니다"
        emptyIcon={<Gift className="h-12 w-12 text-gray-400" />}
        selectable={false}
      />

    </div>
  );
};

export default FreeSharing;