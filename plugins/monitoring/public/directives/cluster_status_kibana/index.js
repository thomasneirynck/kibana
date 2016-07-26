import { capitalize, get } from 'lodash';
import statusIconClass from '../../lib/status_icon_class';
import uiModules from 'ui/modules';
import template from 'plugins/monitoring/directives/cluster_status_kibana/index.html';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringClusterStatusKibana', () => {
  return {
    restrict: 'E',
    template,
    link(scope) {
      scope.getStatusText = () => {
        return `Instances: ${capitalize(scope.pageData.clusterStatus.status)}`;
      };

      scope.getStatusIconClass = () => {
        return statusIconClass(get(scope.pageData, 'clusterStatus.status'));
      };
    }
  };
});
