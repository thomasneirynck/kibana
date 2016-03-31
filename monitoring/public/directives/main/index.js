const app = require('ui/modules').get('plugins/monitoring/directives', []);
app.directive('monitoringMain', (kbnUrl) => {
  return {
    restrict: 'E',
    transclude: true,
    template: require('plugins/monitoring/directives/main/index.html'),
    link: function (scope, _el, attrs) {
      scope.name = attrs.name;
      scope.isActive = function (testPath) {
        return scope.name === testPath;
      };

      scope.routeTo = function (dest) {
        if (dest !== scope.name) {
          kbnUrl.changePath(`/${dest}`);
        }
      };
    }
  };
});
