import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  MapPin,
  Calendar,
  Users,
  Eye,
  Heart,
  Share
} from 'lucide-react';
import { Button } from "../ui";
import { Spinner } from "../ui/spinner";
import CustomSelect, { SelectOption } from '../common/CustomSelect';
import { communityService, ChurchEvent } from '../../services/communityService';
import { formatCreatedAt, formatEventDate } from '../../utils/dateUtils';
import { mapToStandardStatus, getStatusLabel, getStatusClass, getStatusFilterOptions } from '../../utils/status-mapping';


const ChurchEvents: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const categories: SelectOption[] = [
    { value: 'all', label: '전체' },
    { value: 'seminar', label: '세미나' },
    { value: 'revival', label: '부흥회' },
    { value: 'concert', label: '찬양집회' },
    { value: 'conference', label: '컨퍼런스' },
    { value: 'other', label: '기타' }
  ];

  const statusOptions: SelectOption[] = getStatusFilterOptions();

  const getStandardStatus = (legacyStatus: string) => mapToStandardStatus(legacyStatus);
  const getStatusColor = (status: string) => getStatusClass(getStandardStatus(status));
  const getStatusText = (status: string) => getStatusLabel(getStandardStatus(status));

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'seminar':
        return 'bg-purple-100 text-purple-800';
      case 'revival':
        return 'bg-red-100 text-red-800';
      case 'concert':
        return 'bg-yellow-100 text-yellow-800';
      case 'conference':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await communityService.getChurchEvents({
          eventType: selectedCategory === 'all' ? undefined : selectedCategory,
          status: selectedStatus === 'all' ? undefined : selectedStatus,
          search: searchTerm || undefined,
          limit: 50
        });

        // 필터링 로직에서 표준 상태값 사용
        const filteredData = data.filter((item: any) => {
          const standardStatus = getStandardStatus(item.status || 'active');
          const matchesStatus = selectedStatus === 'all' || standardStatus === selectedStatus;
          return matchesStatus;
        });

        setEvents(filteredData);
      } catch (error) {
        console.error('ChurchEvents 데이터 로드 실패:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, selectedStatus, searchTerm]);


  return (
    <div className="p-6">
      {/* 헤더 */}
      <div className="flex justify-between items-end p-6 mb-4">
        <div className="flex-1 max-w-md">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">교회 행사</h1>
          <p className="text-sm text-gray-600">다양한 교회 행사와 소식을 확인하고 참여해보세요</p>
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
              className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
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
            onClick={() => navigate('/community/church-events/create')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {/* 상태 선택 - 별도 필터 */}
      <div className="mb-4">
        <CustomSelect
          options={statusOptions}
          value={selectedStatus}
          onChange={setSelectedStatus}
          className="w-auto"
        />
      </div>

      {/* 행사 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <Spinner size="default" />
          <p className="text-gray-600">교회 행사 목록을 불러오는 중...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
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
                    행사일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조회수
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{event.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(event.eventType)}`}>
                        {categories.find(c => c.value === event.eventType)?.label || event.eventType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.userName || '익명'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.church || '협력사'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {getStatusText(event.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatEventDate(event.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {event.view_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            검색 결과가 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            다른 검색어나 필터를 시도해보세요.
          </p>
        </div>
      )}
    </div>
  );
};

export default ChurchEvents;