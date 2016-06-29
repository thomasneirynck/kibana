import _ from 'lodash';
import statusIconClass from '../../lib/status_icon_class';
const module = require('ui/modules').get('monitoring/directives', []);
module.directive('monitoringClusterStatusElasticsearch', () => {
  return {
    restrict: 'E',
    template: require('plugins/monitoring/directives/cluster_status_elasticsearch/index.html'),
    link(scope) {
      scope.getStatusIconClass = () => {
        return statusIconClass(_.get(scope.pageData, 'clusterStatus.status'));
      };
    }
  };
});
