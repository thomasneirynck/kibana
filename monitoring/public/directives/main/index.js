const app = require('ui/modules').get('plugins/monitoring/directives', []);
app.directive('monitoringMain', (kbnUrl, $location) => {
  return {
    restrict: 'E',
    transclude: true,
    template: require('plugins/monitoring/directives/main/index.html'),
    link: function (scope) {
      scope.isActive = function (testPath) {
        return $location.path() === '/' + testPath;
      };

      scope.routeTo = function (dest) {
        kbnUrl.changePath(`/${dest}`);
      };
    }
  };
});
