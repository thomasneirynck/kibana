import React from 'react';
import ElasticsearchPanel from './elasticsearch_panel';
import LicenseText from './license_text';
import KibanaPanel from './kibana_panel';
import LogstashPanel from './logstash_panel';
import { get } from 'lodash';

export default class Overview extends React.Component {
  constructor(props) {
    super(props);
    const cluster = get(props, 'scope.cluster', {});

    this.state = {
      elasticsearch: { ...cluster.elasticsearch },
      kibana: cluster.kibana,
      license: cluster.license,
      logstash: cluster.logstash
    };
  }

  componentWillMount() {
    this.props.scope.$watch('cluster', (cluster) => {
      cluster = cluster || {};

      this.setState({
        elasticsearch: { ...cluster.elasticsearch},
        kibana: cluster.kibana,
        logstash: cluster.logstash,
        license: cluster.license
      });
    });
  }

  render() {
    const angularChangeUrl = (target) => {
      this.props.scope.$evalAsync(() => {
        this.props.kbnUrl.changePath(target);
      });
    };

    return (
      <div className='monitoring-view'>
        <LicenseText
          license={this.state.license}
          showLicenseExpiration={this.props.showLicenseExpiration}
          angularChangeUrl={angularChangeUrl}
        />

        {/* Elasticsearch info */}
        <div className='page-row'>
          <ElasticsearchPanel {...this.state.elasticsearch} angularChangeUrl={angularChangeUrl} />
        </div>

        {/* Kibana info */}
        <div className='page-row'>
          <KibanaPanel {...this.state.kibana} angularChangeUrl={angularChangeUrl} />
        </div>

        {/* Logstash info */}
        <div className='page-row'>
          <LogstashPanel {...this.state.logstash} angularChangeUrl={angularChangeUrl} />
        </div>

      </div>
    );
  }
}
