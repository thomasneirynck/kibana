import React from 'react';
import formatNumber from 'plugins/monitoring/lib/format_number';
import { ClusterItemContainer, StatusContainer, BytesPercentageUsage } from './helpers';
import { translateKibanaStatus } from 'plugins/monitoring/lib/map_status_classes';

export default class KibanaPanel extends React.Component {
  render() {
    if (!this.props.count) return null;

    const status = translateKibanaStatus(this.props.status);

    return (
      <ClusterItemContainer {...this.props} url='kibana' title='Kibana'>
        <StatusContainer statusPrefix='Instances' status={status}/>

        <div className='row'>
          <div className='col-md-4'>
            <dl data-test-subj='kibana_overview' data-overview-status={status}>
              <dt className='info-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('kibana')}>Overview</a>
              </dt>
              <dd>Requests: {this.props.requests_total}</dd>
              <dd>Max. Response Time: {this.props.response_time_max} ms</dd>
            </dl>
          </div>
          <div className='col-md-4'>
            <dl>
              <dt className='info-title'>
                <a className='link' onClick={() => this.props.angularChangeUrl('kibana/instances')}>
                  Instances: <span data-test-subj='number_of_kibana_instances'>{this.props.count}</span>
                </a>
              </dt>
              <dd>Connections: {formatNumber(this.props.concurrent_connections, 'int_commas')}</dd>
              <dd>Memory Usage: <BytesPercentageUsage usedBytes={this.props.memory_size} maxBytes={this.props.memory_limit} />
              </dd>
            </dl>
          </div>
        </div>
      </ClusterItemContainer>
    );
  }
};
