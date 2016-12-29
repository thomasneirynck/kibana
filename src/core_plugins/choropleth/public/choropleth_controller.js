import uiModules from 'ui/modules';
import ChoroplethMap from './choropleth_map';

const module = uiModules.get('kibana/choropleth', ['kibana']);
module.controller('KbnChoroplethController', function ($scope, $element, Private, getAppState) {

  const containerNode = $element[0];


  const choroplethMap = new ChoroplethMap(containerNode);


  console.log(choroplethMap);


  $scope.$watch('esResponse', async function (response) {
    console.log('esResponse');
  });


  $scope.$watch('vis.params', (options) => {
    console.log('options changed');
  });


});
