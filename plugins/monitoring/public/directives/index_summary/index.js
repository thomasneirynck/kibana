import statusIconClass from '../../lib/status_icon_class';
const mod = require('ui/modules').get('monitoring/directives', []);
const template = require('plugins/monitoring/directives/index_summary/index.html');
mod.directive('monitoringIndexSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { summary: '=' },
    link(scope) {
      function setStatus(summary) {
        let indexStatus = summary.status;
        if (indexStatus.toLowerCase() === 'not available') {
          indexStatus = 'offline';
        }
        scope.summaryStatus = indexStatus;
        scope.statusIconClass = statusIconClass(indexStatus);
      }
      setStatus(scope.summary);

      scope.$watch('summary', function (summary) {
        setStatus(summary);
      });
    }
  };
});

