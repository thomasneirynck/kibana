import uiModules from 'ui/modules';
import choroplethVisParamsTemplate from 'plugins/tagcloud/choropleth_vis_params.html';

uiModules.get('kibana/table_vis')
  .directive('choroplethVisParams', function () {
    return {
      restrict: 'E',
      template: choroplethVisParamsTemplate,
      link: function ($scope, $element) {
        console.log('link', arguments);
        // const sliderContainer = $element[0];
        // const slider = sliderContainer.querySelector('.tag-cloud-fontsize-slider');
        // noUiSlider.create(slider, {
        //   start: [$scope.vis.params.minFontSize, $scope.vis.params.maxFontSize],
        //   connect: true,
        //   tooltips: true,
        //   step: 1,
        //   range: { 'min': 1, 'max': 100 },
        //   format: { to: (value) => parseInt(value) + 'px', from: value => parseInt(value) }
        // });
        // slider.noUiSlider.on('change', function () {
        //   const fontSize = slider.noUiSlider.get();
        //   $scope.vis.params.minFontSize = parseInt(fontSize[0], 10);
        //   $scope.vis.params.maxFontSize = parseInt(fontSize[1], 10);
        //   $scope.$apply();
        // });
      }
    };
  });
