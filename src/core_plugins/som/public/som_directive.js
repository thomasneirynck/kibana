import uiModules from 'ui/modules';


const module = uiModules.get('kibana/tagcloud', ['kibana']);
module.directive('kbnSom', function () {

  return {
    restrict: 'E',
    scope: {
      data: '=',
      options: '='
    },
    template: '<svg class="parent"></svg>',
    replace: 'true',
    link: function (scope, element) {
      console.log('som directive ready!', arguments);
    }
  };
});
