import {uiModules} from 'ui/modules';
import somDirective from 'plugins/som/som_directive.html';
import ponderTemplate from 'plugins/som/ponder_template.html';
import TableFromTabified from 'plugins/som/TableFromTabified';

const module = uiModules.get('kibana/som', ['kibana']);
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


      console.log('som directive....', arguments);
      let somApp;
      scope.$watch('data', function () {


        console.log('data change....');
        if (!scope.data){
          return;
        }

        const tableData = scope.data.table;
        console.log('orig args', scope.data.aggs);

        const ponder = window.PONDER;
        if (somApp) {
          somApp.destroy();
        }
        element[0].innerHTML = null;


        if (!tableData) {
          return;
        }

        element[0].innerHTML = ponderTemplate;


        const tableFromTab = new TableFromTabified(tableData, scope.data.aggs);
        console.log('tabied', tableFromTab);
        window.tab = tableFromTab;


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
            container: element[0],
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
        window.somApp = somApp;


      });


      scope.$watch(getContainerSize, function () {
        console.log('fit!');
        if (somApp) {
          somApp.fit();
        }
      }, true);
      function getContainerSize() {
        return [element.parent().width(), element.parent().height()];
      }


    }
  };
});
