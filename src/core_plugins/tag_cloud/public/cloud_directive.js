import _ from 'lodash';
import uiModules from 'ui/modules';
import TagCloud from 'plugins/tagcloud/tag_cloud';

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

      const tagCloud = new TagCloud(element[0], containerSize());

      function containerSize() {
        return [element.parent().width(), element.parent().height()];
      }

      scope.$watch('data', function () {
        if (!scope.data) {
          return;
        }
        if (scope.data.length > 1) {//cannot happen, since UI-form doesn't allow it.
          throw new Error('Cannot render multiple datasets.');
        }
        tagCloud.setData(scope.data[0].tags);
      });
      scope.$watch('options', function (options) {
        tagCloud.setOptions(options);
      });
      scope.$watch(containerSize, _.debounce(function () {
        tagCloud.setSize(containerSize());
      }, 250), true);

    }
  };
});
