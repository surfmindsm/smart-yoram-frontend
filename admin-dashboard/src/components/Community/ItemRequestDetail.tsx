import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService, RequestItem } from '../../services/communityService';
import CommunityPostDetail, { PostDetailData } from './CommunityPostDetail';

const ItemRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<RequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchItemDetail(parseInt(id));
    }
  }, [id]);

  const fetchItemDetail = async (itemId: number) => {
    try {
      setLoading(true);
      // 목록에서 해당 아이템 찾기 (임시 방법)
      const items = await communityService.getRequestItems();
      const foundItem = items.find(item => item.id === itemId);
      
      if (foundItem) {
        setItem(foundItem);
        // 조회수 증가 API 호출 (필요시)
        // await communityService.incrementViews(itemId);
      } else {
        setError('해당 게시물을 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('상세 정보 조회 실패:', err);
      setError('상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // RequestItem을 PostDetailData로 변환
  const convertToPostDetail = (item: RequestItem): PostDetailData => {
    return {
      id: item.id,
      type: 'item-request',
      title: item.title,
      description: item.description,
      images: (item as any).images || [], // RequestItem에 images 필드가 없으므로 any로 캐스팅
      views: item.views,
      likes: item.likes || 0,
      createdAt: item.createdAt,
      status: item.status,
      category: item.category,
      church: item.church,
      location: item.location,
      contactInfo: item.contactInfo,
      
      // 물품 요청 특화 필드들
      urgency: item.urgency,
      neededDate: item.neededDate,
      userName: item.userName
    };
  };

  if (loading || error || !item) {
    return (
      <CommunityPostDetail
        post={{} as PostDetailData}
        loading={loading}
        error={error}
        onBack={() => navigate('/community/item-request')}
        pageTitle="물품 요청"
      />
    );
  }

  const postData = convertToPostDetail(item);

  // 물품 요청 특화 필드 매핑
  const fieldMappings = [
    {
      key: 'urgency',
      label: '긴급도',
      render: (value: string) => {
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
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(value)}`}>
            {getUrgencyText(value)}
          </span>
        );
      }
    },
    {
      key: 'neededDate',
      label: '필요 날짜',
      type: 'date' as const
    },
    {
      key: 'userName',
      label: '요청자',
      render: (value: string) => (
        <div className="flex items-center">
          <span className="text-gray-900 font-medium">{value || '익명'}</span>
        </div>
      )
    }
  ];

  return (
    <CommunityPostDetail
      post={postData}
      loading={false}
      fieldMappings={fieldMappings}
      pageTitle="물품 요청"
      onBack={() => navigate('/community/item-request')}
    />
  );
};

export default ItemRequestDetail;