const mod = require('ui/modules').get('monitoring/directives', []);
const template = require('plugins/monitoring/directives/welcome_msg/index.html');
mod.directive('monitoringWelcomeMessage', function (isLicenseModeBasic, $window, reportStats, features) {
  return {
    restrict: 'E',
    scope: {
      cluster: '=',
      clusters: '='
    },
    template: template,
    link: (scope) => {
      const hideBanner = $window.localStorage.getItem('monitoring.hideBanner');
      scope.showBanner = (hideBanner) ? false : true;

      if (scope.showBanner && scope.cluster && scope.clusters) {
        if (!isLicenseModeBasic) {
          scope.showBanner = false;
        }
      }

      scope.hideBanner = function () {
        scope.showBanner = false;
      };

      scope.dontShowAgain = function () {
        scope.showBanner = false;
        $window.localStorage.setItem('monitoring.hideBanner', 1);
      };

      scope.reportStats = reportStats;
      if (reportStats) {
        scope.allowReport = features.isEnabled('report', true);
        scope.toggleAllowReport = function () {
          features.update('report', !scope.allowReport);
          scope.allowReport = !scope.allowReport;
        };
      }

    }
  };
});
