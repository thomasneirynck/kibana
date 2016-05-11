import _ from 'lodash';
const app = require('ui/modules').get('plugins/monitoring/directives', []);
app.directive('monitoringMain', (isLicenseModeBasic) => {
  return {
    restrict: 'E',
    transclude: true,
    template: require('plugins/monitoring/directives/main/index.html'),
    link: function (scope, _el, attrs) {
      scope.name = attrs.name;

      // hide tabs for some pages (force to select a cluster before drill-in)
      const noTabs = ['no-data', 'clusters'];
      scope.allowTabs = !_.contains(noTabs, scope.name);

      // hide clusters tab for basic license
      scope.allowClusterTab = !isLicenseModeBasic;

      scope.isActive = function (testPath) {
        return scope.name === testPath;
      };
    }
  };
});
