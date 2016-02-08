define(function (require) {
  var Metric = require('plugins/monitoring/lib/metric');
  var metrics = require('plugins/monitoring/lib/metrics');
  require('plugins/monitoring/services/settings');
  var module = require('ui/modules').get('monitoring/metrics', [ 'monitoring/settings' ]);

  module.service('monitoringMetrics', function (monitoringSettings, $resource, Promise, Private) {
    var ajaxErrorHandlers = Private(require('plugins/monitoring/lib/ajax_error_handlers'));
    return function (cluster, field) {
      return monitoringSettings.fetch()
      .then(function (settings) {
        if (metrics[field]) {
          var metric = new Metric(field, metrics[field], settings[cluster + ':metric-thresholds']);
          return metric;
        }
      })
      .catch(ajaxErrorHandlers.fatalError);
    };
  });
});
