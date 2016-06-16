import React from 'react';
import _ from 'lodash';
import moment from 'moment-timezone';
import statusIconClass from '../../lib/status_icon_class';
const formatNumber = require('../../lib/format_number');

class ClusterItemContainer extends React.Component {
  render() {
    return (
      <div className="monitoring-element cluster-item" onClick={() => this.props.angularChangeUrl(this.props.url)}>
        <h3 className={this.props.url}>
          <a>{this.props.title}</a>
        </h3>
        {this.props.children}
      </div>
    );
  }
};

class StatusContainer extends React.Component {
  render() {
    const iconClass = statusIconClass(this.props.status);

    return (
      <div className='statusContainer'>
        Status <span className={`status status-${this.props.status}`}>
          {_.capitalize(this.props.status)} <i className={iconClass}></i>
        </span>
      </div>
    );
  }
};

class ElasticsearchPanel extends React.Component {
  render() {
    const nodes = this.props.stats.nodes;
    const indices = this.props.stats.indices;
    return (
      <ClusterItemContainer {...this.props} url='elasticsearch' title='Elasticsearch'>
        <StatusContainer status={this.props.status}/>

        <div className='row'>
          <div className='col-md-4'>
            <dl>
              <dt>Overview</dt>
              <dd>Uptime: {formatNumber(nodes.jvm.max_uptime_in_millis, 'time_since')}</dd>
            </dl>
          </div>

          <div className='col-md-4'>
            <dl>
              <dt>Nodes: {formatNumber(nodes.count.total, 'int_commas')}</dt>
              <dd>FS: {formatNumber(nodes.fs.available_in_bytes, 'byte')} / {formatNumber(nodes.fs.total_in_bytes, 'bytes')}</dd>
            </dl>
          </div>

          <div className='col-md-4'>
            <dl>
              <dt>Indices: {formatNumber(indices.count, 'int_commas')}</dt>
              <dd>Doc Count: {formatNumber(indices.docs.count, 'int_commas')}</dd>
              <dd>Min. Shard Replication: {indices.shards.index.replication.min}</dd>
              <dd>Total Shards: {formatNumber(indices.shards.total, 'int_commas')}</dd>
              <dd>Data Store: {formatNumber(indices.store.size_in_bytes, 'bytes')}</dd>
            </dl>
          </div>
        </div>
      </ClusterItemContainer>
    );
  }
};

class KibanaPanel extends React.Component {
  render() {
    if (!this.props.count) return (<div></div>);
    return (
      <ClusterItemContainer {...this.props} url='kibana' title='Kibana'>
        <StatusContainer status={this.props.status}/>

        <dl>
          <dt>Instances: {this.props.count}</dt>
          <dd>Requests: {this.props.requests_total}</dd>
          <dd>Connections: {formatNumber(this.props.concurrent_connections, 'int_commas')}</dd>
          <dd>Max. Response Time: {this.props.response_time_max} ms</dd>
          <dd>Memory Usage: {formatNumber(this.props.memory_size / this.props.memory_limit, '0.00%')}</dd>
        </dl>
      </ClusterItemContainer>
    );
  }
};

class Overview extends React.Component {
  constructor(props) {
    super(props);
    const scope = props.scope;
    const kbnChangePath = props.kbnUrl.changePath;
    const angularChangeUrl = target => {
      scope.$evalAsync(() => {
        kbnChangePath(target);
      });
    };
    this.state = {
      elasticsearch: { ...scope.cluster.elasticsearch },
      kibana: scope.cluster.kibana,
      license: scope.cluster.license,
      angularChangeUrl,
      goToLicense() {
        angularChangeUrl('/license');
      }
    };
  }

  componentWillMount() {
    this.props.scope.$watch('cluster', (cluster) => {
      this.setState({
        elasticsearch: { ...cluster.elasticsearch},
        kibana: cluster.kibana,
        license: cluster.license
      });
    });
  }

  render() {
    const formatDateLocal = (input) => {
      return moment.tz(input, moment.tz.guess()).format('LL');
    };

    return (
      <div className='monitoring-view'>
        <div className='col-md-6'>
          <ElasticsearchPanel {...this.state.elasticsearch} angularChangeUrl={this.state.angularChangeUrl}/>
        </div>
        <div className='col-md-6'>
          <KibanaPanel {...this.state.kibana} angularChangeUrl={this.state.angularChangeUrl}/>
        </div>
        <div className='col-md-12'>
          <p>
            Your { _.capitalize(this.state.license.type)
            } license will expire on <a onClick={ this.state.goToLicense }> {
            formatDateLocal(this.state.license.expiry_date) }.</a>
          </p>
        </div>
      </div>
    );
  }
};

export default Overview;
