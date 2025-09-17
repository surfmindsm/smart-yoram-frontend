import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  MapPin,
  HandHeart
} from 'lucide-react';
import { Button } from '../ui/button';
import { CommunityTable, TableColumn, TableRenderers } from '../common/CommunityTable';
import CustomSelect, { SelectOption } from '../common/CustomSelect';
import { communityService, RequestItem } from '../../services/communityService';
import { getCreatePagePath } from './postConfigs';
import { formatCreatedAt } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass, getStatusFilterOptions } from '../../utils/status-mapping';


const ItemRequest: React.FC = () => {
  console.log('ItemRequest 컴포넌트 로드됨');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // 조회수 증가 함수 (전용 API 사용)
  const incrementViewCount = async (itemId: number) => {
    try {
      const response = await fetch(`https://api.surfmind-team.com/api/v1/community/item-request/${itemId}/increment-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📈 물품요청 조회수 증가: ${data.data?.previous_view_count || 'unknown'} → ${data.data?.new_view_count || 'unknown'}`);
        return data.data?.new_view_count;
      }
    } catch (error) {
      console.error('물품요청 조회수 증가 실패:', error);
    }
  };

  // 상세 페이지로 이동하는 함수
  const handleItemClick = async (item: RequestItem) => {
    // 조회수 증가 (백그라운드에서 실행)
    const newViewCount = await incrementViewCount(item.id);

    // 목록에서 해당 아이템의 조회수 업데이트
    if (newViewCount) {
      setRequestItems(prevItems =>
        prevItems.map(prevItem =>
          prevItem.id === item.id
            ? { ...prevItem, view_count: newViewCount }
            : prevItem
        )
      );
    }

    // 상세 페이지로 이동
    navigate(`/community/item-request/${item.id}`);
  };
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');

  // 요청 게시글 데이터 (API에서 로드)
  const [requestItems, setRequestItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const categories: SelectOption[] = [
    { value: 'all', label: '전체' },
    { value: '가구', label: '가구' },
    { value: '전자제품', label: '전자제품' },
    { value: '도서', label: '도서' },
    { value: '악기', label: '악기' },
    { value: '기타', label: '기타' }
  ];

  const statusOptions: SelectOption[] = getStatusFilterOptions();

  const urgencyOptions: SelectOption[] = [
    { value: 'all', label: '전체 우선순위' },
    { value: 'high', label: '긴급' },
    { value: 'medium', label: '보통' },
    { value: 'low', label: '여유' }
  ];

  const getStandardStatus = (legacyStatus: string) => mapToStandardStatus(legacyStatus);
  const getStatusColor = (status: string) => getStatusClass(getStandardStatus(status));
  const getStatusText = (status: string) => getStatusLabel(getStandardStatus(status));

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return '긴급';
      case 'medium':
        return '보통';
      case 'low':
        return '여유';
      default:
        return '보통';
    }
  };

  const columns: TableColumn[] = [
    {
      key: 'title',
      title: '제목',
      render: (value) => TableRenderers.title(value)
    },
    {
      key: 'category',
      title: '카테고리',
      render: (value) => TableRenderers.badge(value)
    },
    {
      key: 'location',
      title: '지역',
      render: (value) => TableRenderers.location(value, <MapPin className="h-3 w-3 mr-1" />)
    },
    {
      key: 'status',
      title: '상태',
      render: (value) => TableRenderers.badge(getStatusText(value), getStatusColor(value))
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
        console.log('물품 요청 데이터 로딩 시작');
        setLoading(true);
        
        const params = {
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          urgency: selectedUrgency === 'all' ? undefined : selectedUrgency,
          search: searchTerm || undefined,
          limit: 50
        };
        console.log('🔍 현재 필터 상태:', { selectedCategory, selectedStatus, selectedUrgency, searchTerm });
        
        const data = await communityService.getRequestItems(params);
        console.log('물품 요청 데이터 받음:', data?.length || 0, '개');

        // 필터링 로직에서 표준 상태값 사용
        const filteredData = data.filter((item: any) => {
          const standardStatus = getStandardStatus(item.status || 'active');
          const matchesStatus = selectedStatus === 'all' || standardStatus === selectedStatus;
          return matchesStatus;
        });

        setRequestItems(filteredData);
      } catch (error) {
        console.error('물품 요청 데이터 로드 실패:', error);
        setRequestItems([]);
      } finally {
        console.log('물품 요청 데이터 로딩 완료');
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, selectedStatus, selectedUrgency, searchTerm]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilNeeded = (neededDate: string) => {
    const today = new Date();
    const needed = new Date(neededDate);
    const diffTime = needed.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '기한 지남';
    if (diffDays === 0) return '오늘까지';
    if (diffDays === 1) return '내일까지';
    return `${diffDays}일 남음`;
  };


  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end pr-6 mb-4">
        <div className="flex-1 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">물품 요청</h1>
          <p className="text-sm text-gray-600">필요한 물품을 요청하고 다른 교회와 나누어요</p>
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
          <CustomSelect
            options={categories}
            value={selectedCategory}
            onChange={setSelectedCategory}
            className="w-auto"
          />

          {/* New 버튼 */}
          <Button
            onClick={() => navigate(getCreatePagePath('item-request'))}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* 추가 필터들 - 별도 필터 */}
      <div className="mb-4 flex gap-4">
        {/* 상태 선택 */}
        <CustomSelect
          options={statusOptions}
          value={selectedStatus}
          onChange={setSelectedStatus}
          className="w-auto"
        />

        {/* 우선순위 선택 */}
        <CustomSelect
          options={urgencyOptions}
          value={selectedUrgency}
          onChange={setSelectedUrgency}
          className="w-auto"
        />
      </div>

      <CommunityTable
        columns={columns}
        data={requestItems}
        loading={loading}
        onRowClick={handleItemClick}
        emptyMessage="검색 결과가 없습니다"
        emptyIcon={<HandHeart className="h-12 w-12 text-gray-400" />}
        selectable={false}
      />

    </div>
  );
};

export default ItemRequest;