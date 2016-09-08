import uiModules from 'ui/modules';
import ArcInput from 'plugins/tagcloud/ArcInput';

const module = uiModules.get('kibana/tagcloud', ['kibana']);

module.directive('arcInput', function ($timeout) {

  return {
    template: '<div style="width: 100%; height: 100px; margin: 0 auto"></div>',
    link: function (scope, element) {
      const arcInput = new ArcInput(element[0].firstChild, {
        sectorFillStyle: 'rgba(255,255,255,1)',
        sectorStrokeWidth: 3
      });

      arcInput.setMinDegrees(scope.vis.params.fromDegree);
      arcInput.setMaxDegrees(scope.vis.params.toDegree);

      arcInput.on('input', function () {
        scope.vis.params.fromDegree = Math.round(arcInput.getMinDegrees());
        scope.vis.params.toDegree = Math.round(arcInput.getMaxDegrees());
        scope.$apply();
      });

      $timeout(arcInput.resize.bind(arcInput), 100);

    }
  };


});


