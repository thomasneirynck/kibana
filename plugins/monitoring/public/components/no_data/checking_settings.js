import React from 'react';
import PropTypes from 'prop-types';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner
} from '@elastic/eui';

export function CheckingSettings({ checkMessage }) {
  return (
    <EuiFlexGroup alignItems="center" gutterSize="s">
      <EuiFlexItem grow={false}>
        <EuiLoadingSpinner size="m" />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>{checkMessage}...</EuiFlexItem>
    </EuiFlexGroup>
  );
}

CheckingSettings.propTypes = {
  checkMessage: PropTypes.string.isRequired
};
