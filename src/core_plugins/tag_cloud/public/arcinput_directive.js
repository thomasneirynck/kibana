import uiModules from 'ui/modules';
import ArcInput from 'plugins/tagcloud/ArcInput';

const module = uiModules.get('kibana/tagcloud', ['kibana']);

module.directive('arcInput', function ($timeout) {

  return {
    template: '<div style="width:40px;height:40px;border: 1px solid red"></div>',
    link: function (scope, element) {

      const arcInput = new ArcInput(element[0].firstChild);
      arcInput.on('change', function () {
        console.log('input changed');
      });
      $timeout(function () {
        console.log('resize!');
        arcInput.resize();
      });
    }
  };


});


