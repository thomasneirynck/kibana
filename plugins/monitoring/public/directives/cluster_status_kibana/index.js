import _ from 'lodash';
import statusIconClass from '../../lib/status_icon_class';
const module = require('ui/modules').get('monitoring/directives', []);
module.directive('monitoringClusterStatusKibana', () => {
  return {
    restrict: 'E',
    template: require('plugins/monitoring/directives/cluster_status_kibana/index.html'),
    link(scope) {
      scope.getStatusIconClass = () => {
        return statusIconClass(_.get(scope.pageData, 'clusterStatus.status'));
      };
    }
  };
});
