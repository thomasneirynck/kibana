import React from 'react';
import PropTypes from 'prop-types';

import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';

import { CONFIG_TELEMETRY_DESC } from '../../../common/constants';

/**
 * React component for displaying the Telemetry opt-in banner.
 *
 * TODO: When Jest tests become available in X-Pack, we should add one for this component.
 *
 * @param {Function} optInClick Callback function passed a boolean to opt in ({@code true}) or out ({@code false}).
 */
export const OptInBanner = ({ optInClick }) => {
  return (
    <EuiCallOut iconType="questionInCircle" title={CONFIG_TELEMETRY_DESC}>
      <EuiFlexGroup gutterSize="s" alignItems="center">
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            fill
            onClick={() => optInClick(true)}
          >
            Yes
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton
            size="s"
            onClick={() => optInClick(false)}
          >
            No
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCallOut>
  );
};

OptInBanner.propTypes = {
  optInClick: PropTypes.func.isRequired,
};