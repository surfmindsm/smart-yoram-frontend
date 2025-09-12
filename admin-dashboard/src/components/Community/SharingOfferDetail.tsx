import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService, OfferItem } from '../../services/communityService';
import CommunityPostDetail, { PostDetailData } from './CommunityPostDetail';

const SharingOfferDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<OfferItem | null>(null);
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
      const items = await communityService.getOfferItems();
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

  // OfferItem을 PostDetailData로 변환
  const convertToPostDetail = (item: OfferItem): PostDetailData => {
    return {
      id: item.id,
      type: 'item-sale',
      title: item.title,
      description: item.description,
      images: item.images || [], // OfferItem에 images 필드가 없으므로 any로 캐스팅
      views: item.views,
      likes: item.likes || 0,
      createdAt: item.createdAt,
      status: item.status,
      category: item.category,
      church: item.church,
      location: item.location,
      contactInfo: item.contactInfo || '', // OfferItem에 contactInfo 필드가 없으므로 any로 캐스팅
      
      // 물품 판매 특화 필드들
      price: item.price,
      condition: item.condition,
      userName: item.userName
    };
  };

  if (loading || error || !item) {
    return (
      <CommunityPostDetail
        post={{} as PostDetailData}
        loading={loading}
        error={error}
        onBack={() => navigate('/community/item-sale')}
        pageTitle="물품 판매"
      />
    );
  }

  const postData = convertToPostDetail(item);

  // 물품 판매 특화 필드 매핑
  const fieldMappings = [
    {
      key: 'price',
      label: '가격',
      render: (value: string) => (
        <span className="text-lg font-semibold text-green-600">
          ₩{parseFloat(value).toLocaleString()}
        </span>
      )
    },
    {
      key: 'condition',
      label: '상품 상태',
      type: 'badge' as const,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      key: 'userName',
      label: '판매자',
      render: (value: string) => (
        <div className="flex items-center">
          <span className="text-gray-900 font-medium">{value}</span>
        </div>
      )
    }
  ];

  return (
    <CommunityPostDetail
      post={postData}
      loading={false}
      fieldMappings={fieldMappings}
      pageTitle="물품 판매"
      onBack={() => navigate('/community/item-sale')}
    />
  );
};

export default SharingOfferDetail;