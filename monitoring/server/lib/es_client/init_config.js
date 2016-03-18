import { pick } from 'lodash';
import url from 'url';
import { readFileSync } from 'fs';

const readFile = file => readFileSync(file, 'utf8');

function getConfigObjects(config, useMonitoring) {
  const monitoringConfig = config.get('xpack.monitoring.elasticsearch');
  const configSource = useMonitoring ? monitoringConfig : config.get('elasticsearch');
  const esConfig = pick(configSource, 'url', 'username', 'password', 'ssl');

  const options = {
    ...pick(monitoringConfig, 'apiVersion', 'pingTimeout', 'requestTimeout'),
    ...esConfig,
    configSource: useMonitoring ? 'monitoring' : 'production', // for logging and tests
    keepAlive: true,
    auth: true
  };

  const uri = url.parse(options.url);
  if (options.auth && options.username && options.password) {
    uri.auth = `${options.username}:${options.password}`;
  }

  const ssl = options.ssl;
  ssl.rejectUnauthorized = ssl.verify;
  if (ssl.cert && ssl.key) {
    ssl.cert = readFile(ssl.cert);
    ssl.key = readFile(ssl.key);
  }
  if (ssl.ca) {
    ssl.ca = ssl.ca.map(readFile);
  }

  return { options, uri, ssl };
}

/* If Monitoring cluster connection is configured, use that. Otherwise default
 * to the cluster connection config set for Kibana and copy all the Kibana
* config values to monitoring. */
export default function initConfig(config) {
  const prefix = 'monitoring.elasticsearch';
  const useMonitoring = Boolean(config.get(`${prefix}.url`));
  const configObjects = getConfigObjects(config, useMonitoring);

  if (!useMonitoring) {
    // copy calculated configs into monitoring
    config.set('xpack.monitoring.elasticsearch', pick(configObjects.options, 'url', 'username', 'password'));
    config.set('xpack.monitoring.elasticsearch.ssl', pick(configObjects.ssl, 'verify', 'cert', 'key', 'ca'));
  }

  delete configObjects.options.ssl;
  delete configObjects.ssl.verify;

  return {
    ...configObjects,
    readFile // for tests
  };
}
