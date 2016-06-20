const mod = require('ui/modules').get('monitoring/directives', []);
const template = require('plugins/monitoring/directives/welcome_msg/index.html');
mod.directive('monitoringWelcomeMessage', function ($window, reportStats, features) {
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

      if (scope.showBanner && scope.clusters) {
        if (scope.clusters.length > 1) {
          // suppress the banner if it has been shown on listing page
          // if there is 1 cluster, then the listing page has not been shown
          scope.showBanner = false;
        }
      }

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
