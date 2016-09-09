import uiModules from 'ui/modules';
import ArcInput from 'plugins/tagcloud/ArcInput';

const module = uiModules.get('kibana/tagcloud', ['kibana']);

module.directive('arcInput', function ($timeout) {

  return {
    template: `<div class="orientation-selector">
                 <input type="number" min="2" max="36" value="{{vis.params.orientations}}" class="form-control">
                 <div class="sector-selector"></div>
               </div>`,
    link: function (scope, element) {

      const arcInput = new ArcInput(element[0].firstChild.children[1], {
        sectorStrokeWidth: 6
      });
      arcInput.setMinDegrees(scope.vis.params.fromDegree);
      arcInput.setMaxDegrees(scope.vis.params.toDegree);
      arcInput.setBreaks(scope.vis.params.orientations);


      element[0].firstChild.children[0].addEventListener('input', onOrientationChange);
      const onArcChangeHandle = arcInput.on('input', applyChanges);
      const resizeTimeout = $timeout(arcInput.resize.bind(arcInput), 100);

      scope.$on('$destroy', () => {
        $timeout.cancel(resizeTimeout);
        element[0].firstChild.children[0].removeEventListener(onOrientationChange);
        onArcChangeHandle.remove();
      });


      function onOrientationChange(event) {
        arcInput.setBreaks(parseInt(event.target.value, 10) - 1);
        applyChanges();
      }

      function applyChanges() {
        scope.vis.params.orientations = arcInput.getBreaks() + 1;
        scope.vis.params.fromDegree = Math.round(arcInput.getMinDegrees());
        scope.vis.params.toDegree = Math.round(arcInput.getMaxDegrees());
        scope.$apply();
      }

    }
  };


});


