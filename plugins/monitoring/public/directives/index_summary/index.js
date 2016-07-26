import { capitalize, get } from 'lodash';
import statusIconClass from '../../lib/status_icon_class';
import template from 'plugins/monitoring/directives/index_summary/index.html';
import uiModules from 'ui/modules';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringIndexSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { summary: '=' },
    link(scope) {
      scope.getSummaryStatus = () => {
        let indexStatus = get(scope, 'summary.status');
        if (!indexStatus || indexStatus.toLowerCase() === 'not available') {
          indexStatus = 'offline';
        }
        return indexStatus;
      };

      scope.getSummaryStatusText = () => {
        return `Index: ${capitalize(scope.getSummaryStatus())}`;
      };

      scope.getStatusIconClass = () => {
        return statusIconClass(scope.getSummaryStatus());
      };
    }
  };
});

