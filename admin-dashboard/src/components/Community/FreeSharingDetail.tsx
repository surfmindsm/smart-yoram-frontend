import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { communityService, SharingItem } from '../../services/communityService';
import CommunityPostDetail, { PostDetailData } from './CommunityPostDetail';

const FreeSharingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<SharingItem | null>(null);
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
      const items = await communityService.getSharingItems();
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

  // SharingItem을 PostDetailData로 변환
  const convertToPostDetail = (item: SharingItem): PostDetailData => {
    return {
      id: item.id,
      type: 'free-sharing',
      title: item.title,
      description: item.description,
      images: item.images,
      views: item.views,
      likes: item.likes,
      createdAt: item.createdAt,
      status: item.status,
      category: item.category,
      church: item.church || undefined,
      location: item.location,
      contactInfo: item.contactInfo,
      // 무료 나눔 특화 필드들
      condition: item.condition,
      quantity: item.quantity
    };
  };

  // 무료 나눔 전용 추가 필드 매핑
  const fieldMappings = [
    {
      label: '상품 상태',
      key: 'condition',
      type: 'badge' as const,
      color: 'bg-green-100 text-green-800'
    },
    {
      label: '수량',
      key: 'quantity',
      type: 'text' as const
    }
  ];

  if (!item && !loading && !error) {
    return null;
  }

  return (
    <CommunityPostDetail
      post={item ? convertToPostDetail(item) : {} as PostDetailData}
      loading={loading}
      error={error}
      onBack={() => navigate('/community/free-sharing')}
      pageTitle="무료 나눔(드림) 상세"
      fieldMappings={fieldMappings}
    />
  );
};

export default FreeSharingDetail;