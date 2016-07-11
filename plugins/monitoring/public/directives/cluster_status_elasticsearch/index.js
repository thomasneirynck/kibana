import { capitalize, get } from 'lodash';
import statusIconClass from '../../lib/status_icon_class';
const module = require('ui/modules').get('monitoring/directives', []);
module.directive('monitoringClusterStatusElasticsearch', () => {
  return {
    restrict: 'E',
    template: require('plugins/monitoring/directives/cluster_status_elasticsearch/index.html'),
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
