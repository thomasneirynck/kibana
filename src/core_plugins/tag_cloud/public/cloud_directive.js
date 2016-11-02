import _ from 'lodash';
import uiModules from 'ui/modules';
import TagCloud from 'plugins/tagcloud/tag_cloud';
import template from 'plugins/tagcloud/cloud_directive.html';
import AggConfigResult from 'ui/vis/agg_config_result';
import FilterBarFilterBarClickHandlerProvider from 'ui/filter_bar/filter_bar_click_handler';

const module = uiModules.get('kibana/tagcloud', ['kibana']);

module.directive('kbnTagCloud', function (Private, getAppState) {

  const filterBarClickHandler = Private(FilterBarFilterBarClickHandlerProvider);

  return {
    restrict: 'E',
    scope: {
      data: '=',
      options: '='
    },
    template: template,
    replace: 'true',
    link: function (scope, element) {

      let vis;

      const tagCloud = new TagCloud(element[0]);
      tagCloud.on('select', (event) => {
        const appState = getAppState();
        const clickHandler = filterBarClickHandler(appState);
        const aggs = vis.aggs.getResponseAggs();
        const aggConfigResult = new AggConfigResult(aggs[0], false, event, event);
        clickHandler({point: {aggConfigResult: aggConfigResult}});
      });

      function getContainerSize() {
        return {width: element.parent().width(), height: element.parent().height()};
      }

      scope.$watch('data', function () {
        if (!scope.data) {
          return;
        }
        vis = scope.data.vis;
        tagCloud.setData(scope.data.tags);
      });
      scope.$watch('options', function (options) {
        tagCloud.setOptions(options);
      });
      scope.$watch(getContainerSize, _.debounce(function () {
        tagCloud.resize();
      }, 1000, {
        trailing: true
      }), true);

    }
  };
});
