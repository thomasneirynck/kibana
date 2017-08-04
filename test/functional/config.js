/* eslint-disable kibana-custom/no-default-export */

import { resolve } from 'path';
import { resolveKibanaPath } from '@elastic/plugin-helpers';

import {
  SecurityPageProvider,
  ReportingPageProvider,
  MonitoringPageProvider,
  LogstashPageProvider,
} from './page_objects';

import {
  PipelineListProvider,
  PipelineEditorProvider,
  RandomProvider,
  AceEditorProvider,
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
      resolve(__dirname, './apps/security'),
      resolve(__dirname, './apps/reporting'),
      resolve(__dirname, './apps/logstash'),
    ],

    // define the name and providers for services that should be
    // available to your tests. If you don't specify anything here
    // only the built-in services will be avaliable
    services: {
      ...kibanaConfig.get('services'),
      pipelineList: PipelineListProvider,
      pipelineEditor: PipelineEditorProvider,
      random: RandomProvider,
      aceEditor: AceEditorProvider,
    },

    // just like services, PageObjects are defined as a map of
    // names to Providers. Merge in Kibana's or pick specific ones
    pageObjects: {
      ...kibanaConfig.get('pageObjects'),
      security: SecurityPageProvider,
      reporting: ReportingPageProvider,
      monitoring: MonitoringPageProvider,
      logstash: LogstashPageProvider,
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
      }
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
