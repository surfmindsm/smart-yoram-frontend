import React from 'react';
import CommunityPostForm from './CommunityPostForm';
import { churchNewsConfig } from './postConfigs';

const CreateChurchNews: React.FC = () => {
  return (
    <CommunityPostForm
      config={churchNewsConfig}
      onCancel={() => window.location.href = '/community/church-news'}
    />
  );
};

export default CreateChurchNews;