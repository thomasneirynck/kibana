define(function (require) {
  var module = require('ui/modules').get('monitoring/directives', []);
  var template = require('plugins/monitoring/directives/issue_summary/index.html');

  module.directive('monitoringIssueSummary', function () {
    return {
      restrict: 'E',
      scope: {
        title: '@',
        source: '='
      },
      template: template
    };
  });
});
