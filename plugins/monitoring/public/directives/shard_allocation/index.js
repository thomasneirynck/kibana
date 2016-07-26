import labels from 'plugins/monitoring/directives/shard_allocation/lib/labels';
import indicesByNodes from 'plugins/monitoring/directives/shard_allocation/transformers/indicesByNodes';
import nodesByIndices from 'plugins/monitoring/directives/shard_allocation/transformers/nodesByIndices';
import uiModules from 'ui/modules';
import template from 'plugins/monitoring/directives/shard_allocation/index.html';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringShardAllocation', () => {
  return {
    restrict: 'E',
    template,
    scope: {
      view: '@',
      shards: '=',
      nodes: '=',
      shardStats: '='
    },
    link: (scope) => {
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
