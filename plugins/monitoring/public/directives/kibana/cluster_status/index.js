import { capitalize, get } from 'lodash';
import { translateKibanaStatus, statusIconClass } from 'plugins/monitoring/lib/map_status_classes';
import uiModules from 'ui/modules';
import template from './index.html';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringClusterStatusKibana', () => {
  return {
    restrict: 'E',
    template,
    link(scope) {
      scope.getStatusText = () => {
        return `Instances: ${capitalize(get(scope.pageData, 'clusterStatus.status'))}`;
      };

      scope.getStatusClass = () => {
        return translateKibanaStatus(get(scope.pageData, 'clusterStatus.status'));
      };

      scope.getStatusIconClass = () => {
        // get a status that can be mapped to one of the available status icons
        // e.g. if we want a yellow status then it should map to warning icon
        const status = scope.getStatusClass();
        return statusIconClass(status);
      };
    }
  };
});
