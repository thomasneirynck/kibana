import { once, bindKey } from 'lodash';
import url from 'url';
import Promise from 'bluebird';
import elasticsearch from 'elasticsearch';
import initConfig from './init_config';

/* Provide a dedicated Elasticsearch client for Monitoring
 * The connection options can be customized for the Monitoring application
 * This allows the app to connect to a decidated monitoring cluster even if
 * Kibana itself is connected to a production cluster.
 */

function exposeClient(server) {
  const config = server.config();
  const callWithRequestFactory = server.plugins.elasticsearch.callWithRequestFactory;
  const ElasticsearchClientLogging = server.plugins.elasticsearch.ElasticsearchClientLogging;
  const loggingTag = config.get('xpack.monitoring.loggingTag');

  /* Overrides the trace method so we can have query logging
   * logs can be copy+pasted into Sense */
  class MonitoringClientLogging extends ElasticsearchClientLogging {
    trace(method, options, query, _response, statusCode) {
      /* Check if query logging is enabled and if the query has the "meta"
       * field which is added for traceability.
       * It requires Kibana to be configured with verbose logging turned on. */
      if (config.get('xpack.monitoring.elasticsearch.logQueries')) {
        if (options.path.match(/meta=/)) {
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
  }

  function createClient(options, uri, ssl) {
    return new elasticsearch.Client({
      host: url.format(uri),
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
    });
  }

  const { options, authUri, noAuthUri, ssl } = initConfig(config);

  // expose authorized client, used ONLY for internal health checks
  const client = createClient(options, authUri, ssl);
  server.on('close', bindKey(client, 'close'));
  server.expose('client', client);

  // expose callWithRequest using unauthorized client, used for API requests
  const noAuthClient = createClient(options, noAuthUri, ssl);
  const callWithRequest = callWithRequestFactory(noAuthClient);
  server.on('close', bindKey(noAuthClient, 'close'));
  server.expose('callWithRequest', callWithRequest);

  server.log([loggingTag, 'es-client'], `config sourced from: ${options.configSource} cluster (${options.url})`);
}

const instantiateClient = once(exposeClient);

export default instantiateClient;
