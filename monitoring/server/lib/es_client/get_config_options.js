import { chain } from 'lodash';
import url from 'url';
import { readFileSync } from 'fs';

const readFile = file => readFileSync(file, 'utf8');
const prefix = 'monitoring.elasticsearch';

function getOptionsObject(config, useMonitoring) {
  // these keys may be copied from Kibana config
  const configKeys = ['url', 'username', 'password', 'ssl.verify', 'ssl.cert', 'ssl.key', 'ssl.ca'];
  // these options always come from monitoring
  const standardOptions = {
    apiVersion: config.get(`${prefix}.apiVersion`),
    pingTimeout: config.get(`${prefix}.pingTimeout`),
    requestTimeout: config.get(`${prefix}.requestTimeout`),
    keepAlive: true,
    auth: true
  };

  if (useMonitoring) {
    return chain(configKeys)
    .map(key => [key, config.get(`${prefix}.${key}`)])
    .zipObject()
    .merge(standardOptions, {configSource: 'monitoring'})
    .value();
  }

  // url propery in monitoring cluster config is not set
  // copy the configs from kibana to monitoring and return those options
  return chain(configKeys)
  .map(key => {
    // copy configs into the monitoring namespace
    const kibanaConfigVal = config.get(`elasticsearch.${key}`);
    config.set(`${prefix}.${key}`, kibanaConfigVal);
    return [key, kibanaConfigVal];
  })
  .zipObject()
  .merge(standardOptions, {configSource: 'production'})
  .value();
}

/* If Monitoring cluster connection is configured, use that. Otherwise default
 * to the cluster connection config set for Kibana and copy all the Kibana
* config values to monitoring. */
export default function getConfigOptions(config) {
  const options = getOptionsObject(config, Boolean(config.get(`${prefix}.url`)));

  const uri = url.parse(options.url);
  if (options.auth && options.username && options.password) {
    uri.auth = `${options.username}:${options.password}`;
  }

  const ssl = { rejectUnauthorized: options['ssl.verify'] };
  if (options['ssl.cert'] && options['ssl.key']) {
    ssl.cert = readFile(options['ssl.cert']);
    ssl.key = readFile(options['ssl.key']);
  }
  if (options['ssl.ca']) {
    ssl.ca = options['ssl.ca'].map(readFile);
  }

  return { options, uri, ssl };
}
