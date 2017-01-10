import { capitalize, get } from 'lodash';
import { statusIconClass } from 'plugins/monitoring/lib/map_status_classes';
import uiModules from 'ui/modules';
import template from './index.html';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringClusterStatusElasticsearch', () => {
  return {
    restrict: 'E',
    template,
    link(scope) {
      scope.getStatusText = () => {
        return `Cluster: ${capitalize(scope.pageData.clusterStatus.status)}`;
      };

      scope.getStatusIconClass = () => {
        return statusIconClass(get(scope.pageData, 'clusterStatus.status'));
      };
    }
  };
});
