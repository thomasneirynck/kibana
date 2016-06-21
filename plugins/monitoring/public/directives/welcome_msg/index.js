const mod = require('ui/modules').get('monitoring/directives', []);
const template = require('plugins/monitoring/directives/welcome_msg/index.html');
mod.directive('monitoringWelcomeMessage', function ($window, reportStats, features) {
  // Determine if we can skip showing the banner here as it has already been
  // shown on cluster listing.
  // Listing page would show if there are 2+ clusters
  function isAlreadyShownOnListingPage(scope) {
    if (scope.clusters && scope.clusters.length > 1) {
      return true;
    }
    return false;
  }

  return {
    restrict: 'E',
    scope: {
      cluster: '=',
      clusters: '='
    },
    template: template,
    link: (scope) => {
      const hideBanner = $window.localStorage.getItem('monitoring.hideBanner');
      scope.showBanner = (hideBanner) ? false : !isAlreadyShownOnListingPage(scope);

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
