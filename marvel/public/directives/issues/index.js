define(function (require) {
  var _ = require('lodash');
  var template = require('plugins/monitoring/directives/issues/index.html');
  var module = require('ui/modules').get('monitoring/directives', []);
  module.directive('monitoringIssues', function (monitoringMetrics) {
    return {
      restrict: 'E',
      scope: {
        title: '@',
        source: '=',
        link: '@'
      },
      template: template,
      link: function ($scope) {
        $scope.$watch('source.data', function () {
          $scope.status = '';
          if (_.some($scope.source.data, { status: 'yellow'})) {
            $scope.status = 'yellow';
          }
          if (_.some($scope.source.data, { status: 'red' })) {
            $scope.status = 'red';
          }
          $scope.total = $scope.source.data.length;
          $scope.displaying = ($scope.total <= 6) ? $scope.total : 6;
        });
      }
    };
  });
});


