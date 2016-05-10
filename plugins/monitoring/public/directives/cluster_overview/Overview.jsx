import React from 'react';
const formatNumber = require('../../lib/format_number');

const RowContainer = React.createClass({
  render() {
    return (
      <div className="row monitoring-element cluster-item">
        <div className="col-md-10">
          {this.props.children}
        </div>
      </div>
    );
  }
});
const ElasticsearchRow = React.createClass({
  render() {
    const nodes = this.props.nodes;
    const indices = this.props.indices;
    return (
      <RowContainer>
        <dl>
          <dt>
            <a onClick={() => this.props.angularChangeUrl('elasticsearch')}>Elasticsearch</a>
          </dt>
          <dd>
            Uptime: {formatNumber(nodes.jvm.max_uptime_in_millis, 'time_since')}
          </dd>
          <dd>
            Nodes
            <ul>
              <li>Count: {formatNumber(nodes.count.total, 'int_commas')}</li>
              <li>FS Available: {formatNumber(nodes.fs.available_in_bytes, 'byte')}</li>
              <li>FS Free: {formatNumber(nodes.fs.free_in_bytes, 'bytes')}</li>
              <li>FS Total: {formatNumber(nodes.fs.total_in_bytes, 'bytes')}</li>
            </ul>
          </dd>
          <dd>
            Indices
            <ul>
              <li>Count: {formatNumber(indices.count, 'int_commas')}</li>
              <li>Doc Count: {formatNumber(indices.docs.count, 'int_commas')}</li>
              <li>Min. Shard Replication: {indices.shards.index.replication.min}</li>
              <li>Total Shards: {formatNumber(indices.shards.total, 'int_commas')}</li>
              <li>Data Store: {formatNumber(indices.store.size_in_bytes, 'bytes')}</li>
            </ul>
          </dd>
        </dl>
      </RowContainer>
    );
  }
});
const KibanaRow = React.createClass({
  render() {
    if (this.props.count < 1) return (<div></div>);
    return (
      <RowContainer>
        <dl>
          <dt>
            <a onClick={() => this.props.angularChangeUrl('kibana')}>Kibana</a>
          </dt>
          <dd>Instances: {this.props.count}</dd>
        </dl>
      </RowContainer>
    );
  }
});

module.exports = React.createClass({
  displayName: 'Overview',
  getInitialState() {
    const scope = this.props.scope;
    const kbnChangePath = this.props.kbnUrl.changePath;
    return {
      elasticsearch: scope.cluster.stats,
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
        elasticsearch: cluster.stats,
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

