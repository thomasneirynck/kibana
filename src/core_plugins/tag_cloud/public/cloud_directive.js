import d3 from 'd3';
import _ from 'lodash';
import TagCloudVisualization from 'plugins/tagcloud/vis/tag_cloud';
import uiModules from 'ui/modules';
import angular from 'angular';

const module = uiModules.get('kibana/tagcloud', ['kibana']);

module.directive('kbnTagCloud', function () {

  return {
    restrict: 'E',
    scope: {
      data: '=',
      options: '=',
      eventListeners: '='
    },
    template: '<svg class="parent"></svg>',
    replace: 'true',
    link: function (scope, element) {

      //todo: this seems cheap, the element should alwaye readys b
      angular.element(document).ready(function () {

        const tagCloudVis = new TagCloudVisualization();
        const svgContainer = d3.select(element[0]);


        function containerSize() {
          return [element.parent().width(), element.parent().height()];
        }

        function render(data, opts, eventListeners) {
          opts = opts || {};
          eventListeners = eventListeners || {};

          tagCloudVis.setOptions(opts);
          tagCloudVis.setListeners(eventListeners);
          tagCloudVis.setSize(containerSize());

          if (data) {
            // svgContainer.datum(data).call(tagCloudVis);
            tagCloudVis.render(svgContainer.datum(data));
          }
        }

        function reRender() {
          render(scope.data, scope.options, scope.eventListeners);
        }

        scope.$watch('data', function () {
          reRender();
        });
        scope.$watch('options', function (oldOptions, newOptions) {
          if (JSON.stringify(oldOptions) === JSON.stringify(newOptions)) {
            return;
          }
          reRender();
        });
        scope.$watch('eventListeners', function () {
          reRender();
        });
        scope.$watch(containerSize, _.debounce(reRender, 250), true);

        element.bind('resize', function () {
          //todo: do we really want to rerender on a resize? (probably not....)
          //basically, if the data doesn't change, we only want to reposition
          console.log('reszigin...');
          scope.$apply();
        });
      });
    }
  };
});
