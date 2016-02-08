define(function (require) {
  var _ = require('lodash');
  var angular = require('angular');

  var module = require('ui/modules').get('monitoring', []);

  require('ui/routes').when('/setup', {
    template: require('plugins/monitoring/views/setup/setup_template.html')
  });

});
