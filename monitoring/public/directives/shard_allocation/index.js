const labels = require('plugins/monitoring/directives/shard_allocation/lib/labels');
const indicesByNodes = require('plugins/monitoring/directives/shard_allocation/transformers/indicesByNodes');
const nodesByIndices = require('plugins/monitoring/directives/shard_allocation/transformers/nodesByIndices');
const app = require('ui/modules').get('monitoring/directives', []);
require('plugins/monitoring/directives/shard_allocation/directives/clusterView');
app.directive('monitoringShardAllocation', () => {
  return {
    restrict: 'E',
    template: require('plugins/monitoring/directives/shard_allocation/index.html'),
    scope: {
      view: '@',
      shards: '=',
      nodes: '=',
      shardStats: '='
    },
    link: (scope, el, attrs) => {
      const isIndexView = scope.view === 'index';
      const transformer = (isIndexView) ? indicesByNodes(scope) : nodesByIndices(scope);
      scope.isIndexView = isIndexView;
      scope.$watch('shards', (shards) => {
        let view = scope.view;
        scope.totalCount = shards.length;
        scope.showing = transformer(scope.shards, scope.nodes);
        if (isIndexView && shards.some((shard) => shard.state === 'UNASSIGNED')) {
          view += 'WithUnassigned';
        }
        scope.labels = labels[view];
      });
    }
  };
});
