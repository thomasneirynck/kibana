import d3 from 'd3';
import _ from 'lodash';
import visGenerator from 'plugins/tagcloud/vis/index';
import uiModules from 'ui/modules';
import angular from 'angular';

const module = uiModules.get('kibana/tagcloud', ['kibana']);

module.directive('kbnTagCloud', function () {
  function link(scope, element, attrs) {

    angular.element(document).ready(function () {
      let vis = visGenerator();
      let svg = d3.select(element[0]);


      function containerSize() {
        return [element.parent().width(), element.parent().height()];
      }

      function render(data, opts, eventListeners) {
        opts = opts || {};
        eventListeners = eventListeners || {};

        vis.options(opts)
          .listeners(eventListeners)
          .size(containerSize());

        if (data) {
          svg.datum(data).call(vis);
        }
      }

      function reRender() {
        render(scope.data, scope.options, scope.eventListeners);
      }

      scope.$watch('data', reRender);
      scope.$watch('options', reRender);
      scope.$watch('eventListeners', reRender);
      scope.$watch(containerSize, _.debounce(reRender, 250), true);

      element.bind('resize', function () {
        scope.$apply();
      });
    });
  }

  return {
    restrict: 'E',
    scope: {
      data: '=',
      options: '=',
      eventListeners: '='
    },
    template: '<svg class="parent"></svg>',
    replace: 'true',
    link: link
  };
});
