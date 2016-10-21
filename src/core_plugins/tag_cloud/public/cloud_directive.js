import _ from 'lodash';
import uiModules from 'ui/modules';
import TagCloud from 'plugins/tagcloud/vis/tag_cloud';

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

      const tagCloud = new TagCloud(element[0]);
      tagCloud.setSize(containerSize());

      function containerSize() {
        return [element.parent().width(), element.parent().height()];
      }

      scope.$watch('data', function () {
        console.log('data!');

        if (!scope.data) {
          return;
        }
        console.log('data', scope.data.length);
        if (scope.data.length > 1) {
          throw new Error('Cannot render multiple datasets.');
        }
        tagCloud.setData(scope.data[0].tags);
      });
      scope.$watch('options', function (oldOptions, newOptions) {
        tagCloud.setOptions(newOptions);
      });
      scope.$watch(containerSize, _.debounce(function () {
        console.log('containersize', containerSize());
        const size = containerSize();
        tagCloud.setSize(size);
      }, 250), true);

    }
  };
});
