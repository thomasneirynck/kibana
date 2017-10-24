import React from 'react';
import { capitalize } from 'lodash';
import { formatNumber } from 'plugins/monitoring/lib/format_number';
import { KuiKeyboardAccessible } from 'ui_framework/components';
import { ClusterItemContainer, HealthStatusIndicator, BytesPercentageUsage } from './helpers';
import { KibanaStatusIcon } from 'plugins/monitoring/components/kibana/status_icon';

export function KibanaPanel(props) {
  if (!props.count) {
    return null;
  }

  const statusIndicator = (
    <HealthStatusIndicator>
      <KibanaStatusIcon status={props.status} />&nbsp;
      { capitalize(props.status) }
    </HealthStatusIndicator>
  );

  const goToKibana = () => props.changeUrl('kibana');
  const goToInstances = () => props.changeUrl('kibana/instances');

  return (
    <ClusterItemContainer {...props} statusIndicator={statusIndicator} url="kibana" title="Kibana">
      <div className="row">
        <div className="col-md-4">
          <dl data-test-subj="kibana_overview" data-overview-status={status}>
            <dt className="cluster-panel__inner-title">
              <KuiKeyboardAccessible>
                <a className="kuiLink" onClick={goToKibana}>
                  Overview
                </a>
              </KuiKeyboardAccessible>
            </dt>
            <dd data-test-subj="kbnRequests">Requests: { props.requests_total }</dd>
            <dd data-test-subj="kbnMaxResponseTime">Max. Response Time: { props.response_time_max } ms</dd>
          </dl>
        </div>

        <div className="col-md-4">
          <dl>
            <dt className="cluster-panel__inner-title">
              <KuiKeyboardAccessible>
                <a className="kuiLink" onClick={goToInstances} data-test-subj="kbnInstances">
                  Instances: <span data-test-subj="number_of_kibana_instances">{ props.count }</span>
                </a>
              </KuiKeyboardAccessible>
            </dt>
            <dd data-test-subj="kbnConnections">
              Connections: { formatNumber(props.concurrent_connections, 'int_commas') }
            </dd>
            <dd data-test-subj="kbnMemoryUsage">
              Memory Usage: <BytesPercentageUsage usedBytes={props.memory_size} maxBytes={props.memory_limit} />
            </dd>
          </dl>
        </div>
      </div>
    </ClusterItemContainer>
  );
}
