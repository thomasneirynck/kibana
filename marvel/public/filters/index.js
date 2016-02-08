define(function (require) {
  var module = require('ui/modules').get('monitoring/filters', []);
  var formatNumber = require('plugins/monitoring/lib/format_number');
  var extractIp = require('plugins/monitoring/lib/extract_ip');
  var _ = require('lodash');

  module.filter('capitalize', function () {
    return function (input) {
      return _.capitalize(input.toLowerCase());
    };
  });

  module.filter('formatNumber', function () {
    return formatNumber;
  });

  module.filter('extractIp', function () {
    return extractIp;
  });
});

