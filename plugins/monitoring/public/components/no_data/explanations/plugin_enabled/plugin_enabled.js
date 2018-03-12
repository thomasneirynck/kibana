import React from 'react';
import PropTypes from 'prop-types';
import { EuiCode } from '@elastic/eui';

export function ExplainPluginEnabled({ context, property, data }) {
  return (
    <p>
      We checked the {context} settings and found that <EuiCode>{property}</EuiCode>{' '}
      is set to <EuiCode>{data}</EuiCode> set, which disables monitoring.
      Removing the <EuiCode>xpack.monitoring.enabled: false</EuiCode> setting
      from your configuration will put the default into effect and enable Monitoring.
    </p>
  );
}

ExplainPluginEnabled.propTypes = {
  property: PropTypes.string.isRequired,
  context: PropTypes.string.isRequired,
  data: PropTypes.string.isRequired
};
