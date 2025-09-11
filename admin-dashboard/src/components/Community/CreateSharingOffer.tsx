import React from 'react';
import CommunityPostForm from './CommunityPostForm';
import { sharingOfferConfig } from './postConfigs';

const CreateSharingOffer: React.FC = () => {
  return (
    <CommunityPostForm 
      config={sharingOfferConfig}
      onCancel={() => window.location.href = '/community/sharing-offer'}
    />
  );
};

export default CreateSharingOffer;