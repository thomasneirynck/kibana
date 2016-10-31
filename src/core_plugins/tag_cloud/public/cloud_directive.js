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

      const tagCloud = new TagCloud(element[0], getContainerSize());

      function getContainerSize() {
        return {width: element.parent().width(), height: element.parent().height()};
      }

      scope.$watch('data', function () {
        if (!scope.data) {
          return;
        }
        tagCloud.setData(scope.data);
      });
      scope.$watch('options', function (options) {
        tagCloud.setOptions(options);
      });
      scope.$watch(getContainerSize, _.debounce(function () {
        tagCloud.setSize(getContainerSize());
      }, 1000, {
        trailing: true
      }), true);

    }
  };
});
