import { join, resolve } from 'path';
import Promise from 'bluebird';
import requireAllAndApply from '../../server/lib/require_all_and_apply';
import xpackInfo from '../../server/lib/xpack_info';
var pluginSelfCheck = require('./server/lib/plugin_self_check');
var instantiateClient = require('./server/lib/es_client/instantiate_client');

module.exports = function (kibana) {
  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch', 'xpackMain'],
    id: 'monitoring',
    configPrefix: 'xpack.monitoring',
    publicDir: resolve(__dirname, 'public'),
    uiExports: {
      app: {
        title: 'Monitoring',
        description: 'Monitoring for Elasticsearch',
        icon: 'plugins/monitoring/monitoring.svg',
        main: 'plugins/monitoring/monitoring',
        injectVars: function (server, _options) {
          var config = server.config();
          return {
            maxBucketSize: config.get('xpack.monitoring.max_bucket_size'),
            minIntervalSeconds: config.get('xpack.monitoring.min_interval_seconds'),
            kbnIndex: config.get('kibana.index'),
            esApiVersion: config.get('elasticsearch.apiVersion'),
            esShardTimeout: config.get('elasticsearch.shardTimeout'),
            statsReportUrl: config.get('xpack.monitoring.stats_report_url'),
            reportStats: config.get('xpack.monitoring.report_stats'),
            monitoringIndexPrefix: config.get('xpack.monitoring.index_prefix'),
            licenseMode: server.plugins.monitoring.licenseMode,
            googleTagManagerId: config.get('xpack.monitoring.google_tag_manager_id')
          };
        }
      }
    },

    config: function (Joi) {
      const { array, boolean, number, object, string } = Joi;
      return object({
        enabled: boolean().default(true),
        loggingTag: string().default('monitoring-ui'),
        index: string().default('.monitoring-data-2'),
        index_prefix: string().default('.monitoring-es-2-'),
        missing_intervals: number().default(12),
        max_bucket_size: number().default(10000),
        min_interval_seconds: number().default(10),
        report_stats: boolean().default(true),
        google_tag_manager_id: string().default('GTM-WXMHGM'),
        node_resolver: string().regex(/^(?:transport_address|name)$/).default('transport_address'),
        stats_report_url: Joi.when('$dev', {
          is: true,
          then: string().default('../api/monitoring/v1/phone-home'),
          otherwise: string().default('https://marvel-stats.elasticsearch.com/appdata/marvelOpts')
        }),
        agent: object({
          interval: string().regex(/[\d\.]+[yMwdhms]/).default('10s')
        }).default(),
        elasticsearch: object({
          logQueries: boolean().default(false),
          url: string().uri({ scheme: ['http', 'https'] }), // if empty, use Kibana's connection config
          username: string(),
          password: string(),
          requestTimeout: number().default(30000),
          pingTimeout: number().default(30000),
          ssl: object({
            verify: boolean().default(true),
            ca: array().single().items(string()),
            cert: string(),
            key: string()
          }).default(),
          apiVersion: string().default('master'),
          engineVersion: string().valid('^5.0.0').default('^5.0.0')
        })
        .default()
      }).default();
    },

    init: function (server, _options) {
      return Promise.all([
        instantiateClient(server), // Instantiate the dedicated Elasticsearch client
        pluginSelfCheck(this, server), // Make sure the Monitoring index is created and the Kibana version is supported
        requireAllAndApply(join(__dirname, 'server', 'routes', '**', '*.js'), server), // Require all the routes
      ])
      .then(() => {
        xpackInfo(server.plugins.monitoring.client)
        .then(info => {
          server.expose('licenseMode', info.mode);
        });
      });
    }
  });
};
