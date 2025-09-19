import React from 'react';
import CommunityPostForm from './CommunityPostForm';
import { itemSaleConfig } from './postConfigs';

const CreateSharingOffer: React.FC = () => {
  return (
    <CommunityPostForm 
      config={itemSaleConfig}
      onCancel={() => window.location.href = '/community/item-sale'}
    />
  );
};

export default CreateSharingOffer;