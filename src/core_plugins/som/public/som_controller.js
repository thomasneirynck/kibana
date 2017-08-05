import { uiModules} from 'ui/modules';
import {AggResponseTabifyProvider} from 'ui/agg_response/tabify/tabify';

const module = uiModules.get('kibana/som', ['kibana']);

module.controller('KbnSomController', function ($scope, $element, Private) {


  console.log('load controller!');

  const tabifyAggResponse = Private(AggResponseTabifyProvider);
  window.scop = $scope;

  $scope.$watch('esResponse', function (response) {

    console.log('response!!!!');

    if (!response){
      return;
    }

    if (scop.vis.aggs.length < 1) {
      console.log('must have more configs');
      return;
    }

    console.log('som controller responding!', response);
    const vis = $scope.vis;


    console.log('vis', vis);

    const tableGroups = tabifyAggResponse(vis, response, {
      asAggConfigResults: true
    });

    window.response = response;

    $scope.data = {
      table: tableGroups.tables[0],
      aggs: $scope.vis.aggs
    }


  });
});

