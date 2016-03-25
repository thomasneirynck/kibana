require('ui/autoload/all');
require('plugins/monitoring/less/main.less');
require('plugins/monitoring/filters/index.js');
require('plugins/monitoring/directives/index.js');
require('plugins/monitoring/services/clusters');
require('plugins/monitoring/services/features.js');
require('plugins/monitoring/services/executor.js');
require('plugins/monitoring/views/no_data/no_data_controller.js');
require('plugins/monitoring/views/home/home_controller.js');
require('plugins/monitoring/views/indices/indices_controller.js');
require('plugins/monitoring/views/index/index_controller.js');
require('plugins/monitoring/views/nodes/nodes_controller.js');
require('plugins/monitoring/views/node/node_controller.js');
require('plugins/monitoring/views/overview/overview_controller.js');
require('plugins/monitoring/views/license/index.js');
require('ui/modules').get('kibana').config(function (PrivateProvider) {
  PrivateProvider.swap(require('ui/config/defaults'), function ($injector) {
    var defaults = $injector.invoke(require('ui/config/defaults'));
    defaults['timepicker:timeDefaults'] = {
      type: 'json',
      value: JSON.stringify({
        from: 'now-1h',
        to: 'now',
        mode: 'quick'
      })
    };
    defaults['timepicker:refreshIntervalDefaults'] = {
      type: 'json',
      value: JSON.stringify({
        display: '10 seconds',
        pause: false,
        value: 10000
      })
    };
    return defaults;
  });
});

// Enable Angular routing
require('ui/routes')
  .enable();

require('ui/chrome')
  .setTabDefaults({
    resetWhenActive: true,
    trackLastPath: true
  })
  .setRootController('monitoring', function ($scope, courier) {
    $scope.$on('application.load', function () {
      courier.start();
    });
  });

