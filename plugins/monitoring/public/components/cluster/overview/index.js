import React from 'react';
import { ElasticsearchPanel } from './elasticsearch_panel';
import { LicenseText } from './license_text';
import { KibanaPanel } from './kibana_panel';
import { LogstashPanel } from './logstash_panel';
import { AlertsPanel } from './alerts_panel';

export function Overview(props) {
  return (
    <div>
      <LicenseText
        license={props.cluster.license}
        showLicenseExpiration={props.showLicenseExpiration}
        changeUrl={props.changeUrl}
      />

      <div className="page-row">
        <AlertsPanel alerts={props.cluster.alerts} changeUrl={props.changeUrl}/>
      </div>

      <div className="page-row">
        <ElasticsearchPanel {...props.cluster.elasticsearch} ml={props.cluster.ml} changeUrl={props.changeUrl}/>
      </div>

      <div className="page-row">
        <KibanaPanel {...props.cluster.kibana} changeUrl={props.changeUrl}/>
      </div>

      <div className="page-row">
        <LogstashPanel {...props.cluster.logstash} changeUrl={props.changeUrl}/>
      </div>
    </div>
  );
}
