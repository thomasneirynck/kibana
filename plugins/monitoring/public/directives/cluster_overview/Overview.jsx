import React from 'react';
import _ from 'lodash';
import moment from 'moment-timezone';
import statusIconClass from '../../lib/status_icon_class';
import formatNumber from '../../lib/format_number';

class ClusterItemContainer extends React.Component {
  render() {
    // Note: kebabCase takes something like 'Elastic Search' and makes it 'elastic-search', which is ideal for CSS names
    return (
      <div className="monitoring-element cluster-item panel-product">
        <h3
            className={`panel-heading panel-heading-${_.kebabCase(this.props.title)}`}
            onClick={() => this.props.angularChangeUrl(this.props.url)}>
          {this.props.title}
        </h3>
        <div className="panel-body">
          {this.props.children}
        </div>
      </div>
    );
  }
}

class StatusContainer extends React.Component {
  render() {
    const iconClass = statusIconClass(this.props.status);

    return (
      <div className='statusContainer'>
        <span className={`status status-${this.props.status}`}>
          <i className={iconClass} title={`${this.props.statusPrefix}: ${_.capitalize(this.props.status)}`}></i>
        </span> Status
      </div>
    );
  }
}

class ElasticsearchPanel extends React.Component {
  constructor(props) {
    super(props);
    this.goToLicense = () => {
      props.angularChangeUrl('/license');
    };
  }

  render() {
    const nodes = this.props.stats.nodes;
    const indices = this.props.stats.indices;
    const formatDateLocal = (input) => {
      return moment.tz(input, moment.tz.guess()).format('LL');
    };

    return (
      <ClusterItemContainer {...this.props} url='elasticsearch' title='Elasticsearch'>
        <StatusContainer statusPrefix='Cluster' status={this.props.status}/>

        <div className='row'>
          <div className='col-md-4'>
            <dl>
              <dt>
                <a onClick={() => this.props.angularChangeUrl('elasticsearch')}>Overview</a>
              </dt>
              <dd>Uptime: {formatNumber(nodes.jvm.max_uptime_in_millis, 'time_since')}</dd>
            </dl>
          </div>

          <div className='col-md-4'>
            <dl>
              <dt>
                <a onClick={() => this.props.angularChangeUrl('nodes')}>Nodes: {formatNumber(nodes.count.total, 'int_commas')}</a>
              </dt>
              <dd>FS: {formatNumber(nodes.fs.available_in_bytes, 'byte')} / {formatNumber(nodes.fs.total_in_bytes, 'bytes')}</dd>
            </dl>
          </div>

          <div className='col-md-4'>
            <dl>
              <dt>
                <a onClick={() => this.props.angularChangeUrl('indices')}>Indices: {formatNumber(indices.count, 'int_commas')}</a>
              </dt>
              <dd>Doc Count: {formatNumber(indices.docs.count, 'int_commas')}</dd>
              <dd>Min. Shard Replication: {indices.shards.index.replication.min}</dd>
              <dd>Total Shards: {formatNumber(indices.shards.total, 'int_commas')}</dd>
              <dd>Data Store: {formatNumber(indices.store.size_in_bytes, 'bytes')}</dd>
            </dl>
          </div>
        </div>
        <p className="licenseInfo">
          Your { _.capitalize(this.props.license.type)
          } license will expire on <a onClick={ this.goToLicense }> {
          formatDateLocal(this.props.license.expiry_date) }.</a>
        </p>
      </ClusterItemContainer>
    );
  }
}

class KibanaPanel extends React.Component {
  render() {
    if (!this.props.count) return (<div></div>);
    return (
      <ClusterItemContainer {...this.props} url='kibanas' title='Kibana'>
        <StatusContainer statusPrefix='Instances' status={this.props.status}/>

        <div className='row'>
          <div className='col-md-4'>
            <dl>
              <dt>
                <a onClick={() => this.props.angularChangeUrl('kibanas')}>Overview</a>
              </dt>
              <dd>Requests: {this.props.requests_total}</dd>
              <dd>Max. Response Time: {this.props.response_time_max} ms</dd>
            </dl>
          </div>
          <div className='col-md-4'>
            <dl>
              <dt>
                <a onClick={() => this.props.angularChangeUrl('kibana')}>Instances: {this.props.count}</a>
              </dt>
              <dd>Connections: {formatNumber(this.props.concurrent_connections, 'int_commas')}</dd>
              <dd>Memory Usage: {formatNumber(this.props.memory_size / this.props.memory_limit, '0.00%')}</dd>
            </dl>
          </div>
        </div>
      </ClusterItemContainer>
    );
  }
}

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
      angularChangeUrl
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
    return (
      <div className='monitoring-view'>
        <div className='col-md-6'>
          <ElasticsearchPanel {...this.state.elasticsearch} license={this.state.license} angularChangeUrl={this.state.angularChangeUrl}/>
        </div>
        <div className='col-md-6'>
          <KibanaPanel {...this.state.kibana} angularChangeUrl={this.state.angularChangeUrl}/>
        </div>
      </div>
    );
  }
}

export default Overview;
