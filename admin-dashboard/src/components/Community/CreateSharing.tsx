import React from 'react';
import CommunityPostForm from './CommunityPostForm';
import { freeSharingConfig } from './postConfigs';

const CreateSharing: React.FC = () => {
  return (
    <CommunityPostForm 
      config={freeSharingConfig}
      onCancel={() => window.location.href = '/community/free-sharing'}
    />
  );
};

export default CreateSharing;