import _ from 'lodash';
const app = require('ui/modules').get('plugins/monitoring/directives', []);
app.directive('monitoringMain', (globalState) => {
  return {
    restrict: 'E',
    transclude: true,
    template: require('plugins/monitoring/directives/main/index.html'),
    link: function (scope, _el, attrs) {
      scope.name = attrs.name;
      // hide clusters tab for basic license
      scope.allowClusterTab = _.get(globalState, 'license.type') !== 'basic';
      scope.isActive = function (testPath) {
        return scope.name === testPath;
      };
    }
  };
});
