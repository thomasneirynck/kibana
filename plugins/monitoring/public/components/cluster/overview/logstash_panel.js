import React from 'react';
import { formatNumber } from 'plugins/monitoring/lib/format_number';
import { KuiKeyboardAccessible } from 'ui_framework/components';
import { ClusterItemContainer, BytesPercentageUsage } from './helpers';
import { Tooltip } from 'plugins/monitoring/components/tooltip';

export function LogstashPanel(props) {
  if (!props.node_count) {
    return null;
  }

  const goToLogstash = () => props.angularChangeUrl('logstash');
  const goToNodes = () => props.angularChangeUrl('logstash/nodes');
  const goToPipelines = () => props.angularChangeUrl('logstash/pipelines');

  return (
    <ClusterItemContainer {...props} url="logstash" title="Logstash">
      <div className="row">
        <div className="col-md-4">
          <dl data-test-subj="logstash_overview">
            <dt className="cluster-panel__inner-title">
              <KuiKeyboardAccessible>
                <a className="kuiLink" onClick={goToLogstash}>
                  Overview
                </a>
              </KuiKeyboardAccessible>
            </dt>
            <dd data-test-subj="lsEventsReceived">
              Events Received: { formatNumber(props.events_in_total, '0.[0]a') }
            </dd>
            <dd data-test-subj="lsEventsEmitted">
              Events Emitted: { formatNumber(props.events_out_total, '0.[0]a') }
            </dd>
          </dl>
        </div>
        <div className="col-md-4">
          <dl>
            <dt className="cluster-panel__inner-title">
              <KuiKeyboardAccessible>
                <a className="kuiLink" onClick={goToNodes} data-test-subj="lsNodes">
                  Nodes: <span data-test-subj="number_of_logstash_instances">{ props.node_count }</span>
                </a>
              </KuiKeyboardAccessible>
            </dt>
            <dd data-test-subj="lsUptime">
              Uptime: { formatNumber(props.max_uptime, 'time_since') }
            </dd>
            <dd data-test-subj="lsJvmHeap">
              JVM Heap: <BytesPercentageUsage usedBytes={props.avg_memory_used} maxBytes={props.avg_memory} />
            </dd>
          </dl>
        </div>
        <div className="col-md-4">
          <dl>
            <dt className="cluster-panel__inner-title">
              <KuiKeyboardAccessible>
                <a className="link" onClick={goToPipelines} data-test-subj="lsPipelines">
                  <Tooltip
                    text="Beta Feature"
                    placement="bottom"
                    trigger="hover"
                  >
                    <span className="kuiIcon fa-flask betaIcon" />
                  </Tooltip>
                  Pipelines: <span data-test-subj="number_of_logstash_pipelines">{ props.pipeline_count }</span>
                </a>
              </KuiKeyboardAccessible>
            </dt>
          </dl>
        </div>
      </div>
    </ClusterItemContainer>
  );
}
