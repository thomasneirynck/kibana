import { uiModules} from 'ui/modules';
import {AggResponseTabifyProvider} from 'ui/agg_response/tabify/tabify';
import TableFromTabified from './TableFromTabified';
import ponderTemplate from './ponder_template.html';

const module = uiModules.get('kibana/som', ['kibana']);

module.controller('KbnSomController', function ($scope, $element, Private) {


  console.log('load controller!');

  const tabifyAggResponse = Private(AggResponseTabifyProvider);
  window._somScope = $scope;


  let somApp;
  $scope.$watch('resize', function () {
    console.log('resize!');
    if (somApp) {
      somApp.fit();
    }
  });

  $scope.$watch('esResponse', function (response) {

    console.log('response!!!!');

    if (!response){
      return;
    }

    if ($scope.vis.aggs.length < 1) {
      console.log('must have more configs');
      return;
    }

    console.log('som controller responding!', response);
    const vis = $scope.vis;


    console.log('vis', vis);

    const tableGroups = tabifyAggResponse(vis, response, {
      asAggConfigResults: true
    });

    window._somReponse = response;

    $scope.data = {
      table: tableGroups.tables[0],
      aggs: $scope.vis.aggs
    };


    ////------------------------
    const data = $scope.data;
    if (!data) {
      return;
    }

    const tableData = data.table;
    console.log('orig args', data.aggs);

    const ponder = window.PONDER;
    if (somApp) {
      somApp.destroy();
    }
    $element[0].innerHTML = null;


    if (!tableData) {
      return;
    }

    $element[0].innerHTML = ponderTemplate;


    const tableFromTab = new TableFromTabified(tableData, data.aggs);
    console.log('tabied', tableFromTab);

    console.log('going to create som');
    somApp = ponder.createSOM({
      table: tableFromTab,
      nodes: {
        toolbar: "mapToolContainer",
        mapTableToggle: "toggle",
        table: "tableContainer",
        map: "map",
        toggleToMap: "toggle-to-map",
        toggleToTable: "toggle-to-table",
        container: $element[0],
        center: "center",
        waiting: "waiting"
      },
      bmu: {
        initialColumn: null //?bwerugh?
      }
    });


    somApp.on("AppLoaded", function () {
      console.log('loaded');
    });

    console.log(somApp);
    window._somApp = somApp;


  });
});

