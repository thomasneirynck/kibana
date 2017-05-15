import { uiModules } from 'ui/modules';
import { CONFIG_ALLOW_REPORT } from 'monitoring-constants';
import template from './welcome_banner.html';

const app = uiModules.get('monitoring/hacks');

app.directive('welcomeBanner', ($injector) => {

  const config = $injector.get('config');
  const reportStats = $injector.get('reportStats');

  return {
    restrict: 'E',
    template,
    controllerAs: 'welcome',
    controller() {
      this.reportStats = reportStats;
      this.allowReport = config.get(CONFIG_ALLOW_REPORT, true); // initialize

      this.toggleOpt = ({ allowReport }) => {
        this.allowReport = allowReport;
        config.set(CONFIG_ALLOW_REPORT, allowReport);
      };
    }
  };
});
