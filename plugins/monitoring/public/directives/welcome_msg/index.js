import template from 'plugins/monitoring/directives/welcome_msg/index.html';
import uiModules from 'ui/modules';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringWelcomeMessage', function ($window, reportStats, features) {
  function showPerContext(scope) {
    switch (scope.context) {
      case 'listing':
      case 'no-data':
        return true;
      case 'overview':
        // check cluster length to see if cluster listing has been bypassed
        return scope.clusters && scope.clusters.length === 1;
      default:
        return false;
    }
  }

  return {
    restrict: 'E',
    scope: {
      context: '@',
      clusters: '='
    },
    template: template,
    link: (scope) => {
      const hideBanner = $window.localStorage.getItem('monitoring.hideBanner');
      scope.showBanner = !hideBanner && showPerContext(scope);

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
