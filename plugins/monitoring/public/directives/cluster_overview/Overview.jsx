import React from 'react';
import _ from 'lodash';
import moment from 'moment-timezone';
import statusIconClass from '../../lib/status_icon_class';
import formatNumber, { formatBytesUsage, formatPercentageUsage } from '../../lib/format_number';

class ClusterItemContainer extends React.Component {
  render() {
    // Note: kebabCase takes something like 'My Name' and makes it 'my-name', which is ideal for CSS names
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

class BytesUsage extends React.Component {
  render() {
    return (
      <abbr title={formatPercentageUsage(this.props.used_bytes, this.props.max_bytes)}>
        {formatBytesUsage(this.props.used_bytes, this.props.max_bytes)}
      </abbr>
    );
  }
}

class BytesPercentageUsage extends React.Component {
  render() {
    return (
      <abbr title={formatBytesUsage(this.props.used_bytes, this.props.max_bytes)}>
        {formatPercentageUsage(this.props.used_bytes, this.props.max_bytes)}
      </abbr>
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
    let replicas = _.get(indices, 'shards.replication', 'N/A');
    if (replicas !== 'N/A') {
      replicas = formatNumber(replicas, 'int_commas');
    }

    return (
      <ClusterItemContainer {...this.props} url='elasticsearch' title='Elasticsearch'>
        <StatusContainer statusPrefix='Cluster' status={this.props.status}/>

        <div className='row'>
          <div className='col-md-4'>
            <dl data-test-subj='elasticsearch_overview' data-overview-status={this.props.status}>
              <dt>
                <a onClick={() => this.props.angularChangeUrl('elasticsearch')}>Overview</a>
              </dt>
              <dd>Version: {nodes.versions[0]}</dd>
              <dd>Uptime: {formatNumber(nodes.jvm.max_uptime_in_millis, 'time_since')}</dd>
            </dl>
          </div>

          <div className='col-md-4'>
            <dl>
              <dt>
                <a onClick={() => this.props.angularChangeUrl('elasticsearch/nodes')}>
                  Nodes: <span data-test-subj='number_of_elasticsearch_nodes'>{formatNumber(nodes.count.total, 'int_commas')}</span>
                </a>
              </dt>
              <dd>Disk Available: <BytesUsage used_bytes={nodes.fs.available_in_bytes} max_bytes={nodes.fs.total_in_bytes} /></dd>
              <dd>
                JVM Heap: <BytesPercentageUsage used_bytes={nodes.jvm.mem.heap_used_in_bytes} max_bytes={nodes.jvm.mem.heap_max_in_bytes} />
              </dd>
            </dl>
          </div>

          <div className='col-md-4'>
            <dl>
              <dt>
                <a onClick={() => this.props.angularChangeUrl('elasticsearch/indices')}>
                  Indices: {formatNumber(indices.count, 'int_commas')}
                </a>
              </dt>
              <dd>Documents: {formatNumber(indices.docs.count, 'int_commas')}</dd>
              <dd>Disk Usage: {formatNumber(indices.store.size_in_bytes, 'bytes')}</dd>
              <dd>Primary Shards: {formatNumber(_.get(indices, 'shards.primaries'), 'int_commas')}</dd>
              <dd>Replica Shards: {replicas}</dd>
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
      <ClusterItemContainer {...this.props} url='kibana' title='Kibana'>
        <StatusContainer statusPrefix='Instances' status={this.props.status}/>

        <div className='row'>
          <div className='col-md-4'>
            <dl data-test-subj='kibana_overview' data-overview-status={this.props.status}>
              <dt>
                <a onClick={() => this.props.angularChangeUrl('kibana')}>Overview</a>
              </dt>
              <dd>Requests: {this.props.requests_total}</dd>
              <dd>Max. Response Time: {this.props.response_time_max} ms</dd>
            </dl>
          </div>
          <div className='col-md-4'>
            <dl>
              <dt>
                <a onClick={() => this.props.angularChangeUrl('kibana/instances')}>
                  Instances: <span data-test-subj='number_of_kibana_instances'>{this.props.count}</span>
                </a>
              </dt>
              <dd>Connections: {formatNumber(this.props.concurrent_connections, 'int_commas')}</dd>
              <dd>Memory Usage: <BytesPercentageUsage used_bytes={this.props.memory_size} max_bytes={this.props.memory_limit} />
              </dd>
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
