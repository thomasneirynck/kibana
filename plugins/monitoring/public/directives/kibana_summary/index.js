import statusIconClass from '../../lib/status_icon_class';
const mod = require('ui/modules').get('monitoring/directives', []);
const template = require('plugins/monitoring/directives/kibana_summary/index.html');
mod.directive('monitoringKibanaSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { kibana: '=' },
    link(scope) {
      function setStatus(kibana) {
        const online = kibana.availability;
        let clusterStatus = kibana.status;

        if (!online) {
          clusterStatus = 'offline';
        }

        scope.kibanaStatus = clusterStatus;
        scope.statusClass = clusterStatus;
        scope.statusIconClass = statusIconClass(clusterStatus);
      }
      setStatus(scope.kibana);

      scope.$watch('kibana', function (kibana) {
        setStatus(kibana);
      });
    }
  };
});
