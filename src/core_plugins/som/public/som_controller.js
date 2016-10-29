import uiModules from 'ui/modules';
import AggResponseTabifyTabifyProvider from 'ui/agg_response/tabify/tabify';

const module = uiModules.get('kibana/som', ['kibana']);

module.controller('KbnSomController', function ($scope, Private) {

  const tabifyAggResponse = Private(AggResponseTabifyTabifyProvider);

  $scope.$watch('esResponse', function (response) {

    if (!response){
      return;
    }

    console.log('som controller responding!', response);
    const vis = $scope.vis;
    const tableGroups = tabifyAggResponse(vis, response, {
      asAggConfigResults: true
    });

    console.log(tableGroups.tables[0]);
    $scope.data = tableGroups.tables[0];


  });
});

