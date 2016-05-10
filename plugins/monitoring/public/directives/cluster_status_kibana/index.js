const module = require('ui/modules').get('monitoring/directives', []);
module.directive('monitoringClusterStatusKibana', () => {
  return {
    restrict: 'E',
    template: require('plugins/monitoring/directives/cluster_status_kibana/index.html'),
    link: () => {
    }
  };
});
