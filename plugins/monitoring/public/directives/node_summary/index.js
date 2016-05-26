import statusIconClass from '../../lib/status_icon_class';
const mod = require('ui/modules').get('monitoring/directives', []);
const template = require('plugins/monitoring/directives/node_summary/index.html');
mod.directive('monitoringNodeSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { node: '=' },
    link(scope) {
      function setStatus(node) {
        const nodeStatus = node.status;
        if (nodeStatus.toLowerCase() === 'online') {
          scope.summaryStatus = 'green';
          scope.statusIconClass = statusIconClass('green');
        } else {
          scope.summaryStatus = 'offline';
          scope.statusIconClass = statusIconClass('offline');
        }
      }
      setStatus(scope.node);

      scope.$watch('node', function (node) {
        setStatus(node);
      });
    }
  };
});
