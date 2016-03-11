var join = require('path').join;
var requireAllAndApply = require('./server/lib/require_all_and_apply');
var pluginSelfCheck = require('./server/lib/plugin_self_check');

module.exports = function (kibana) {
  return new kibana.Plugin({
    require: ['elasticsearch'],
    id: 'monitoring',
    publicDir: join(__dirname, 'public'),

    uiExports: {
      app: {
        title: 'Monitoring',
        description: 'Monitoring for Elasticsearch',
        icon: 'plugins/monitoring/monitoring.svg',
        main: 'plugins/monitoring/monitoring',
        injectVars: function (server, _options) {
          var config = server.config();
          return {
            maxBucketSize: config.get('monitoring.max_bucket_size'),
            minIntervalSeconds: config.get('monitoring.min_interval_seconds'),
            kbnIndex: config.get('kibana.index'),
            esApiVersion: config.get('elasticsearch.apiVersion'),
            esShardTimeout: config.get('elasticsearch.shardTimeout'),
            statsReportUrl: config.get('monitoring.stats_report_url'),
            reportStats: config.get('monitoring.report_stats'),
            monitoringIndexPrefix: config.get('monitoring.index_prefix'),
            googleTagManagerId: config.get('monitoring.google_tag_manager_id')
          };
        }
      }
    },

    config: function (Joi) {
      const { boolean, number, object, string } = Joi;
      return object({
        enabled: boolean().default(true),
        index: string().default('.monitoring-data-1'),
        index_prefix: string().default('.monitoring-es-1-'),
        missing_intervals: number().default(12),
        max_bucket_size: number().default(10000),
        min_interval_seconds: number().default(10),
        report_stats: boolean().default(true),
        google_tag_manager_id: string().default('GTM-WXMHGM'),
        node_resolver: string().regex(/^(?:transport_address|name)$/).default('transport_address'),
        stats_report_url: Joi.when('$dev', {
          is: true,
          then: Joi.string().default('../api/monitoring/v1/phone-home'),
          otherwise: Joi.string().default('https://marvel-stats.elasticsearch.com/appdata/monitoringOpts')
        }),
        agent: Joi.object({
          interval: Joi.string().regex(/[\d\.]+[yMwdhms]/).default('10s')
        }).default()
      }).default();
    },

    init: function (server, _options) {
      // Make sure the Monitoring index is created and the Kibana version is supported
      pluginSelfCheck(this, server);
      // Require all the routes
      requireAllAndApply(join(__dirname, 'server', 'routes', '**', '*.js'), server);
    }
  });
};
