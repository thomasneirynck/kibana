const mod = require('ui/modules').get('monitoring/directives', []);
const template = require('plugins/monitoring/directives/index_summary/index.html');
mod.directive('monitoringIndexSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { summary: '=' }
  };
});

