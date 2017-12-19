import React from 'react';
import { FormattedMessage } from 'plugins/monitoring/components/alerts/formatted_message';
import { mapSeverity, mapSeverityColor } from 'plugins/monitoring/components/alerts/map_severity';
import { formatTimestampToDuration } from 'monitoring-common';
import { CALCULATE_DURATION_SINCE } from 'monitoring-constants';
import { formatDateTimeLocal } from 'monitoring-formatting';

import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiButton,
  EuiText,
  EuiTextColor,
  EuiSpacer,
  EuiCallOut,
} from '@elastic/eui';

export function AlertsPanel({ alerts, changeUrl }) {
  const goToAlerts = () => changeUrl('/alerts');

  if (!alerts || !alerts.length) {
    // no-op
    return null;
  }

  // enclosed component for accessing changeUrl
  function TopAlertItem({ item, index }) {

    return (
      <EuiCallOut
        key={`alert-item-${index}`}
        data-test-subj="topAlertItem"
        className="kuiVerticalRhythm"
        color={mapSeverityColor(item.metadata.severity)}
        title={mapSeverity(item.metadata.severity).humanized}
      >
        <p>
          <FormattedMessage
            prefix={item.prefix}
            suffix={item.suffix}
            message={item.message}
            metadata={item.metadata}
            changeUrl={changeUrl}
          />
        </p>
        <EuiText size="xs">
          <p data-test-subj="alertMeta">
            <EuiTextColor color="subdued">
              Last checked {
                formatDateTimeLocal(item.update_timestamp)
              } (since {
                formatTimestampToDuration(item.timestamp, CALCULATE_DURATION_SINCE)
              } ago)
            </EuiTextColor>
          </p>
        </EuiText>
      </EuiCallOut>
    );
  }

  const topAlertItems = alerts.map((item, index) => <TopAlertItem item={item} key={`top-alert-item-${index}`} index={index} />);

  return (
    <div data-test-subj="clusterAlertsContainer">
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem grow={false}>
          <EuiTitle>
            <h2>
              Top cluster alerts
            </h2>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton size="s" onClick={goToAlerts} data-test-subj="viewAllAlerts">
            View all { alerts.total } alerts
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      { topAlertItems }
      <EuiSpacer size="xxl" />
    </div>
  );
}
