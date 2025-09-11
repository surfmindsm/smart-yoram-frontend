import React from 'react';
import CommunityPostForm from './CommunityPostForm';
import { jobPostingConfig } from './postConfigs';

const CreateJobPosting: React.FC = () => {
  return (
    <CommunityPostForm 
      config={jobPostingConfig}
      onCancel={() => window.location.href = '/community/job-posting'}
    />
  );
};

export default CreateJobPosting;