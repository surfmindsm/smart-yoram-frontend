import React from 'react';
import CommunityPostForm from './CommunityPostForm';
import { itemRequestConfig } from './postConfigs';

const CreateItemRequest: React.FC = () => {
  return (
    <CommunityPostForm 
      config={itemRequestConfig}
      onCancel={() => window.location.href = '/community/item-request'}
    />
  );
};

export default CreateItemRequest;