import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CommunityPostForm from './CommunityPostForm';
import { getCommonFormConfig, isCommonFormType } from './postConfigs';

/**
 * 공통 폼을 사용하는 모든 커뮤니티 타입의 통합 생성 페이지
 * URL 패턴: /community/{type}/create
 */
const CreateCommunityPost: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  // type이 없거나 공통 폼 타입이 아닌 경우 처리
  if (!type || !isCommonFormType(type)) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            잘못된 접근입니다
          </h3>
          <p className="text-gray-600 mb-4">
            지원되지 않는 컨텐츠 타입입니다.
          </p>
          <button
            onClick={() => navigate('/community')}
            className="text-blue-600 hover:text-blue-700"
          >
            커뮤니티 홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const config = getCommonFormConfig(type);
  
  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            설정을 찾을 수 없습니다
          </h3>
          <p className="text-gray-600 mb-4">
            해당 타입의 폼 설정을 찾을 수 없습니다.
          </p>
          <button
            onClick={() => navigate('/community')}
            className="text-blue-600 hover:text-blue-700"
          >
            커뮤니티 홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const handleCancel = () => {
    navigate(config.listPath);
  };

  return (
    <CommunityPostForm 
      config={config}
      onCancel={handleCancel}
    />
  );
};

export default CreateCommunityPost;