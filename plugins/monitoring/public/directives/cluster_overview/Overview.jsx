import React from 'react';
import _ from 'lodash';
import statusIconClass from '../../lib/status_icon_class';
const formatNumber = require('../../lib/format_number');

const ClusterItemContainer = React.createClass({
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
});

const StatusContainer = React.createClass({
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
});

const ElasticsearchRow = React.createClass({
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
              <dd>FS Available: {formatNumber(nodes.fs.available_in_bytes, 'byte')}</dd>
              <dd>FS Total: {formatNumber(nodes.fs.total_in_bytes, 'bytes')}</dd>
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
});
const KibanaRow = React.createClass({
  render() {
    if (this.props.count < 1) return (<div></div>);
    return (
      <ClusterItemContainer {...this.props} url='kibana' title='Kibana'>
        <StatusContainer status={this.props.status}/>

        <dl>
          <dt>Instances: {this.props.count}</dt>
          <dd>Requests: {this.props.requests}</dd>
          <dd>Connections: {this.props.connections}</dd>
        </dl>
      </ClusterItemContainer>
    );
  }
});

module.exports = React.createClass({
  displayName: 'Overview',
  getInitialState() {
    const scope = this.props.scope;
    const kbnChangePath = this.props.kbnUrl.changePath;
    return {
      elasticsearch: { ...scope.cluster.elasticsearch },
      kibana: scope.cluster.kibana,
      angularChangeUrl(target) {
        scope.$evalAsync(() => {
          kbnChangePath(target);
        });
      }
    };
  },
  componentWillMount() {
    this.props.scope.$watch('cluster', (cluster) => {
      this.setState({
        elasticsearch: { ...cluster.elasticsearch},
        kibana: cluster.kibana});
    });
  },
  render() {
    return (
      <div>
        <ElasticsearchRow {...this.state.elasticsearch} angularChangeUrl={this.state.angularChangeUrl}/>
        <KibanaRow {...this.state.kibana} angularChangeUrl={this.state.angularChangeUrl}/>
      </div>
    );
  }
});

