import { capitalize } from 'lodash';
import React from 'react';
import { Tooltip } from 'plugins/monitoring/components/tooltip';
import { FormattedMessage } from 'plugins/monitoring/components/alerts/formatted_message';
import { SeverityIcon } from 'plugins/monitoring/components/alerts/severity_icon';
import { mapSeverity } from 'plugins/monitoring/components/alerts/map_severity';
import {
  KuiKeyboardAccessible,
  KuiMenu,
  KuiMenuItem,
  KuiEvent,
  KuiEventSymbol,
  KuiEventBody,
  KuiEventBodyMessage,
  KuiEventBodyMetadata
} from 'ui_framework/components';
import { formatTimestampToDuration } from 'plugins/monitoring/lib/format_number';
import { CALCULATE_DURATION_SINCE } from 'monitoring-constants';
import { formatDateTimeLocal } from 'monitoring-formatting';

export function AlertsPanel({ alerts, changeUrl }) {
  const goToAlerts = () => changeUrl('/alerts');

  if (!alerts || !alerts.length) {
    // no-op
    return null;
  }

  // enclosed component for accessing changeUrl
  function TopAlertItem({ item, index }) {
    return (
      <KuiMenuItem key={`alert-item-${index}`} data-test-subj={'topAlertItem'}>
        <KuiEvent>
          <KuiEventSymbol>
            <Tooltip text={`${capitalize(mapSeverity(item.metadata.severity))} severity alert`} placement="bottom" trigger="hover">
              <SeverityIcon severity={item.metadata.severity} />
            </Tooltip>
          </KuiEventSymbol>

          <KuiEventBody>
            <KuiEventBodyMessage>
              <FormattedMessage
                prefix={item.prefix}
                suffix={item.suffix}
                message={item.message}
                metadata={item.metadata}
                changeUrl={changeUrl}
              />
            </KuiEventBodyMessage>

            <KuiEventBodyMetadata data-test-subj="alertMeta">
              Last checked {
                formatDateTimeLocal(item.update_timestamp)
              } (since {
                formatTimestampToDuration(item.timestamp, CALCULATE_DURATION_SINCE)
              } ago)
            </KuiEventBodyMetadata>
          </KuiEventBody>
        </KuiEvent>
      </KuiMenuItem>
    );
  }

  const topAlertItems = alerts.map((item, index) => <TopAlertItem item={item} key={`top-alert-item-${index}`} index={index} />);

  return (
    <div data-test-subj="clusterAlertsContainer">
      <h2 className="kuiSubTitle kuiVerticalRhythm">
        Top Cluster Alerts
      </h2>
      <KuiMenu contained className="kuiVerticalRhythm">
        { topAlertItems }
      </KuiMenu>
      <p className="kuiText kuiVerticalRhythm">
        <KuiKeyboardAccessible>
          <a className="kuiLink" onClick={goToAlerts} data-test-subj="viewAllAlerts">
            View all { alerts.total } alerts
          </a>
        </KuiKeyboardAccessible>
      </p>
    </div>
  );
}
