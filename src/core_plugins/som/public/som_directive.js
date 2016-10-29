import uiModules from 'ui/modules';
import somDirective from 'plugins/som/som_directive.html';
import Table from 'plugins/som/Table';

const module = uiModules.get('kibana/tagcloud', ['kibana']);
module.directive('kbnSom', function () {

  return {
    restrict: 'E',
    scope: {
      data: '=',
      options: '='
    },
    template: somDirective,
    replace: 'true',
    link: function (scope, element) {
      console.log('som directive ready!', arguments);

      const table = new Table();

      console.log('table', table);
    }
  };
});
