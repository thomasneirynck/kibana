/* eslint-disable kibana-custom/no-default-export */

import { resolve } from 'path';
import { resolveKibanaPath } from '@elastic/plugin-helpers';

import {
  SecurityPageProvider,
  ReportingPageProvider,
  MonitoringPageProvider,
  LogstashPageProvider,
  GraphPageProvider,
  GrokDebuggerPageProvider,
} from './page_objects';

import {
  MonitoringClusterListProvider,
  MonitoringClusterOverviewProvider,
  MonitoringClusterAlertsProvider,
  MonitoringElasticsearchSummaryStatusProvider,
  MonitoringElasticsearchNodesProvider,
  MonitoringElasticsearchNodeDetailProvider,
  MonitoringElasticsearchIndicesProvider,
  MonitoringElasticsearchIndexDetailProvider,
  MonitoringElasticsearchShardsProvider,
  PipelineListProvider,
  PipelineEditorProvider,
  RandomProvider,
  AceEditorProvider,
  GrokDebuggerProvider,
} from './services';

// the default export of config files must be a config provider
// that returns an object with the projects config values
export default async function ({ readConfigFile }) {

  // read the Kibana config file so that we can utilize some of
  // its services and PageObjects
  const kibanaConfig = await readConfigFile(resolveKibanaPath('test/functional/config.js'));

  return {
    // list paths to the files that contain your plugins tests
    testFiles: [
      resolve(__dirname, './apps/graph'),
      resolve(__dirname, './apps/monitoring'),
      resolve(__dirname, './apps/dashboard_mode'),
      resolve(__dirname, './apps/security'),
      resolve(__dirname, './apps/reporting'),
      resolve(__dirname, './apps/logstash'),
      resolve(__dirname, './apps/grok_debugger'),
    ],

    // define the name and providers for services that should be
    // available to your tests. If you don't specify anything here
    // only the built-in services will be avaliable
    services: {
      ...kibanaConfig.get('services'),
      monitoringClusterList: MonitoringClusterListProvider,
      monitoringClusterOverview: MonitoringClusterOverviewProvider,
      monitoringClusterAlerts: MonitoringClusterAlertsProvider,
      monitoringElasticsearchSummaryStatus: MonitoringElasticsearchSummaryStatusProvider,
      monitoringElasticsearchNodes: MonitoringElasticsearchNodesProvider,
      monitoringElasticsearchNodeDetail: MonitoringElasticsearchNodeDetailProvider,
      monitoringElasticsearchIndices: MonitoringElasticsearchIndicesProvider,
      monitoringElasticsearchIndexDetail: MonitoringElasticsearchIndexDetailProvider,
      monitoringElasticsearchShards: MonitoringElasticsearchShardsProvider,
      pipelineList: PipelineListProvider,
      pipelineEditor: PipelineEditorProvider,
      random: RandomProvider,
      aceEditor: AceEditorProvider,
      grokDebugger: GrokDebuggerProvider,
    },

    // just like services, PageObjects are defined as a map of
    // names to Providers. Merge in Kibana's or pick specific ones
    pageObjects: {
      ...kibanaConfig.get('pageObjects'),
      security: SecurityPageProvider,
      reporting: ReportingPageProvider,
      monitoring: MonitoringPageProvider,
      logstash: LogstashPageProvider,
      graph: GraphPageProvider,
      grokDebugger: GrokDebuggerPageProvider,
    },

    servers: {
      elasticsearch: {
        port: 9240,
        auth: 'elastic:changeme',
        username: 'elastic',
        password: 'changeme',
      },
      kibana: {
        port: 5640,
        auth: 'elastic:changeme',
        username: 'elastic',
        password: 'changeme',
      },
    },
    env: {
      kibana: {
        server: {
          uuid: '5b2de169-2785-441b-ae8c-186a1936b17d', // Kibana UUID for "primary" cluster in monitoring data
        }
      }
    },

    // the apps section defines the urls that
    // `PageObjects.common.navigateTo(appKey)` will use.
    // Merge urls for your plugin with the urls defined in
    // Kibana's config in order to use this helper
    apps: {
      ...kibanaConfig.get('apps'),
      login: {
        pathname: '/login'
      },
      monitoring: {
        pathname: '/app/monitoring'
      },
      logstashPipelines: {
        pathname: '/app/kibana',
        hash: '/management/logstash/pipelines'
      },
      graph: {
        pathname: '/app/graph',
      },
      grokDebugger: {
        pathname: '/app/kibana',
        hash: '/dev_tools/grokdebugger'
      },
    },

    // choose where esArchiver should load archives from
    esArchiver: {
      directory: resolve(__dirname, 'es_archives')
    },

    // choose where screenshots should be saved
    screenshots: {
      directory: resolve(__dirname, 'screenshots')
    }
  };
}
