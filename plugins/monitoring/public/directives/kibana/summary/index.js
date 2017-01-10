import { get, capitalize } from 'lodash';
import { statusIconClass } from 'plugins/monitoring/lib/map_status_classes';
import uiModules from 'ui/modules';
import template from './index.html';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringKibanaSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { kibana: '=' },
    link(scope) {
      scope.getSummaryStatus = () => {
        const online = get(scope, 'kibana.availability');
        let status = get(scope, 'kibana.status');
        if (!online) {
          status = 'offline';
        }
        return status;
      };

      scope.getSummaryStatusText = () => {
        return `Instance: ${capitalize(scope.getSummaryStatus())}`;
      };

      scope.getStatusIconClass = () => {
        return statusIconClass(scope.getSummaryStatus());
      };
    }
  };
});
