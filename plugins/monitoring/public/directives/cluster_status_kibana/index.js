import _ from 'lodash';
import statusIconClass from '../../lib/status_icon_class';
const module = require('ui/modules').get('monitoring/directives', []);
module.directive('monitoringClusterStatusKibana', () => {
  return {
    restrict: 'E',
    template: require('plugins/monitoring/directives/cluster_status_kibana/index.html'),
    link(scope) {
      const clusterStatus = _.get(scope.pageData, 'clusterStatus.status');
      scope.statusIconClass = statusIconClass(clusterStatus);
    }
  };
});
