const module = require('ui/modules').get('monitoring/directives', []);
module.directive('monitoringClusterStatusElasticsearch', (kbnUrl) => {
  return {
    restrict: 'E',
    template: require('plugins/monitoring/directives/cluster_status_elasticsearch/index.html'),
    link: (scope) => {
      scope.goToLicense = () => {
        kbnUrl.changePath('/license');
      };

    }
  };
});
