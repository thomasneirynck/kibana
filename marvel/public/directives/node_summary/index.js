const mod = require('ui/modules').get('monitoring/directives', []);
const template = require('plugins/monitoring/directives/node_summary/index.html');
mod.directive('monitoringNodeSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { node: '=' }
  };
});
