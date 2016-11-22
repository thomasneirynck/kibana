import { once, bindKey } from 'lodash';
import Promise from 'bluebird';
import initConfig from './init_config';

/* Provide a dedicated Elasticsearch client for Monitoring
 * The connection options can be customized for the Monitoring application
 * This allows the app to connect to a decidated monitoring cluster even if
 * Kibana itself is connected to a production cluster.
 */

export function exposeClient(server, elasticsearch) {
  const config = server.config();
  const callWithRequestFactory = server.plugins.elasticsearch.callWithRequestFactory;
  const ElasticsearchClientLogging = server.plugins.elasticsearch.ElasticsearchClientLogging;
  const loggingTag = config.get('xpack.monitoring.loggingTag');

  /* Overrides the trace method so we can have query logging
   * logs can be copy+pasted into Sense */
  class MonitoringClientLogging extends ElasticsearchClientLogging {
    trace(method, options, query, _response, statusCode) {
      /* Check if query logging is enabled
       * It requires Kibana to be configured with verbose logging turned on. */
      if (config.get('xpack.monitoring.elasticsearch.logQueries')) {
        const methodAndPath = `${method} ${options.path}`;
        const queryDsl = query ? query.trim() : '';
        server.log([loggingTag, 'es-query'], [
          statusCode,
          methodAndPath,
          queryDsl
        ].join('\n'));
      }
    }
  }

  function createClient(options, uri, ssl) {
    const params = {
      host: {
        host: uri.hostname,
        port: uri.port,
        protocol: uri.protocol,
        path: uri.pathname,
        auth: uri.auth,
        query: uri.query,
        headers: config.get('xpack.monitoring.elasticsearch.customHeaders') // separate customHeaders config for separate monitoring connection
      },
      ssl: ssl,
      plugins: options.plugins,
      apiVersion: options.apiVersion,
      keepAlive: options.keepAlive,
      pingTimeout: options.pingTimeout,
      requestTimeout: options.requestTimeout,
      defer: function () {
        return Promise.defer();
      },
      log: MonitoringClientLogging
    };
    return new elasticsearch.Client(params);
  }

  const { options, authUri, noAuthUri, ssl } = initConfig(config);

  // expose authorized client, used ONLY for internal health checks
  const client = createClient(options, authUri, ssl);
  server.on('close', bindKey(client, 'close'));
  server.expose('client', client);

  // expose callWithRequest using unauthorized client, used for API requests
  const noAuthOptions = {
    ...options,
    auth: false
  };
  const noAuthClient = createClient(noAuthOptions, noAuthUri, ssl);
  const callWithRequest = callWithRequestFactory(noAuthClient);
  server.on('close', bindKey(noAuthClient, 'close'));
  server.expose('callWithRequest', callWithRequest);

  server.log([loggingTag, 'es-client'], `config sourced from: ${options.configSource} cluster (${noAuthUri.host})`);
}

const instantiateClient = once(exposeClient);

export default instantiateClient;
