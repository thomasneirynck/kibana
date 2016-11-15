import _ from 'lodash';
import uiModules from 'ui/modules';
import TagCloud from 'plugins/tagcloud/tag_cloud';
import AggConfigResult from 'ui/vis/agg_config_result';
import FilterBarFilterBarClickHandlerProvider from 'ui/filter_bar/filter_bar_click_handler';

const module = uiModules.get('kibana/tagcloud', ['kibana']);


module.controller('KbnCloudController', function ($scope, $element, Private, getAppState) {

  const filterBarClickHandler = Private(FilterBarFilterBarClickHandlerProvider);
  const tagCloud = new TagCloud($element[0]);
  tagCloud.on('select', (event) => {
    const appState = getAppState();
    const clickHandler = filterBarClickHandler(appState);
    const aggs = $scope.vis.aggs.getResponseAggs();
    const aggConfigResult = new AggConfigResult(aggs[0], false, event, event);
    clickHandler({point: {aggConfigResult: aggConfigResult}});
  });

  $scope.$watch('esResponse', async function (response) {

    if (!response) {
      return;
    }

    const tagsAggId = _.first(_.pluck($scope.vis.aggs.bySchemaName.segment, 'id'));
    if (!tagsAggId || !response.aggregations) {
      return;
    }

    const metricsAgg = _.first($scope.vis.aggs.bySchemaName.metric);
    const buckets = response.aggregations[tagsAggId].buckets;

    const tags = buckets.map((bucket) => {
      return {
        text: bucket.key,
        size: metricsAgg.getValue(bucket) || metricsAgg.getValue
      };
    });
    tagCloud.setData(tags);

    await tagCloud.whenRendered();
    if (typeof $scope.vis.emit === 'function') {
      $scope.vis.emit('renderComplete');
    }
  });


  $scope.$watch('vis.params', function (options) {
    tagCloud.setOptions(options);
  });

  $scope.$watch(getContainerSize, _.debounce(function () {
    tagCloud.resize();
  }, 1000, {
    trailing: true
  }), true);


  function getContainerSize() {
    return {width: $element.width(), height: $element.height()};
  }

});
