import React from 'react';
import { EuiProgress } from '@elastic/eui';

export default ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }

  return <EuiProgress size="xs" position="fixed" />;
};
