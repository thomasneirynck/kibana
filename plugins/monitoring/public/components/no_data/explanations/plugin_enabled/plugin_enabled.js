import React from 'react';
import PropTypes from 'prop-types';
import {
  EuiCode,
  EuiText,
  EuiHorizontalRule,
  EuiTextColor,
  EuiTitle,
} from '@elastic/eui';

export function ExplainPluginEnabled({ context, property, data }) {
  return (
    <div>
      <EuiTitle size="l">
        <h2>You need to make some adjustments</h2>
      </EuiTitle>
      <EuiTextColor color="subdued">
        <EuiText>
          <p>To run monitoring please perform the following steps</p>
        </EuiText>
      </EuiTextColor>
      <EuiHorizontalRule size="half" />
      <EuiText>
        <p>
          We checked the {context} settings and found that <EuiCode>{property}</EuiCode>{' '}
          is set to <EuiCode>{data}</EuiCode> set, which disables monitoring.
          Removing the <EuiCode>xpack.monitoring.enabled: false</EuiCode> setting
          from your configuration will put the default into effect and enable Monitoring.
        </p>
      </EuiText>
    </div>
  );
}

ExplainPluginEnabled.propTypes = {
  property: PropTypes.string.isRequired,
  context: PropTypes.string.isRequired,
  data: PropTypes.string.isRequired
};
