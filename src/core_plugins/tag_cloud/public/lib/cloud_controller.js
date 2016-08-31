import _ from 'lodash';
import uiModules from 'ui/modules';

const module = uiModules.get('kibana/tagcloud', ['kibana']);

module.controller('KbnCloudController', function ($scope) {
  $scope.$watch('esResponse', function (response) {

    if (!response) {
      $scope.data = null;
      return;
    }

    const tagsAggId = _.first(_.pluck($scope.vis.aggs.bySchemaName.segment, 'id'));
    if (!tagsAggId || !response.aggregations) {
      $scope.data = null;
      return;
    }

    const metricsAgg = _.first($scope.vis.aggs.bySchemaName.metric);
    const buckets = response.aggregations[tagsAggId].buckets;

    const tags = buckets.map(function (bucket) {
      return {
        text: bucket.key,
        size: metricsAgg.getValue(bucket)
      };
    });

    $scope.data = [{tags: tags}];
  });
});


