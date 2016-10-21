import d3 from 'd3';
import _ from 'lodash';
import MultiTagCloud from 'plugins/tagcloud/vis/multi_tag_cloud';
import uiModules from 'ui/modules';

const module = uiModules.get('kibana/tagcloud', ['kibana']);

module.directive('kbnTagCloud', function () {

  return {
    restrict: 'E',
    scope: {
      data: '=',
      options: '='
    },
    template: '<svg class="parent"></svg>',
    replace: 'true',
    link: function (scope, element) {

      const svgContainer = d3.select(element[0]);
      const multiTagCloud = new MultiTagCloud();
      multiTagCloud.setSize(containerSize());

      function containerSize() {
        return [element.parent().width(), element.parent().height()];
      }

      scope.$watch('data', function () {
        if (!scope.data) {
          return;
        }
        console.log('data', scope.data.length);
        if (scope.data.length > 1) {
          throw new Error('Cannot render multiple datasets.');
        }
        multiTagCloud.setData(svgContainer.datum(scope.data));
      });
      scope.$watch('options', function (oldOptions, newOptions) {
        multiTagCloud.setOptions(newOptions);
      });
      scope.$watch(containerSize, _.debounce(function () {
        console.log('containersize', containerSize());
        const size = containerSize();
        multiTagCloud.setSize(size);
      }, 250), true);

    }
  };
});
