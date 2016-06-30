var _ = require('lodash');
require('ui/autoload/all');
require('plugins/monitoring/less/main.less');
require('plugins/monitoring/filters/index.js');
require('plugins/monitoring/directives/index.js');
require('plugins/monitoring/services/clusters.js');
require('plugins/monitoring/services/features.js');
require('plugins/monitoring/services/executor.js');
require('plugins/monitoring/services/license.js');
require('plugins/monitoring/services/title.js');
require('plugins/monitoring/views/no_data/no_data_controller.js');
require('plugins/monitoring/views/license/index.js');
require('plugins/monitoring/views/clusters/listing_controller.js');
require('plugins/monitoring/views/clusters/overview_controller.js');
require('plugins/monitoring/views/elasticsearch/overview/overview_controller.js');
require('plugins/monitoring/views/elasticsearch/indices/indices_controller.js');
require('plugins/monitoring/views/elasticsearch/index/index_controller.js');
require('plugins/monitoring/views/elasticsearch/nodes/nodes_controller.js');
require('plugins/monitoring/views/elasticsearch/node/node_controller.js');
require('plugins/monitoring/views/kibana/overview/kibanas_controller.js');
require('plugins/monitoring/views/kibana/instance/kibana_controller.js');

require('ui/modules').get('kibana').run(function (uiSettings) {
  _.set(uiSettings, 'defaults.timepicker:timeDefaults.value', JSON.stringify({
    from: 'now-1h',
    to: 'now',
    mode: 'quick'
  }));
  _.set(uiSettings, 'defaults.timepicker:refreshIntervalDefaults.value', JSON.stringify({
    display: '10 seconds',
    pause: false,
    value: 10000
  }));
});

// Enable Angular routing
require('ui/routes')
  .enable();

require('ui/chrome')
  .setRootController('monitoring', function ($scope, courier) {
    $scope.$on('application.load', function () {
      courier.start();
    });
  });

