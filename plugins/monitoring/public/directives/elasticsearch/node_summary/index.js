import { get } from 'lodash';
import { statusIconClass } from 'plugins/monitoring/lib/map_status_classes';
import uiModules from 'ui/modules';
import template from './index.html';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringNodeSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { node: '=' },
    link(scope) {
      scope.getOnlineClass = () => {
        const nodeStatus = get(scope, 'node.status');
        if (nodeStatus && nodeStatus.toLowerCase() === 'online') {
          return 'green';
        } else {
          return 'offline';
        }
      };

      scope.getStatusIconClass = () => {
        return statusIconClass(scope.getOnlineClass());
      };
    }
  };
});
