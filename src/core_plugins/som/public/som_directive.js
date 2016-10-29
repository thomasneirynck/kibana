import uiModules from 'ui/modules';
import somDirective from 'plugins/som/som_directive.html';
import ponderTemplate from 'plugins/som/ponder_template.html';
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


      let somApp;

      scope.$watch('data', function () {
        const ponder = window.PONDER;

        if (somApp){
          console.log('destory da app');
          somApp.destroy();
        }

        element[0].innerHTML = null;


        if (!scope.data) {
          return;
        }

        element[0].innerHTML = ponderTemplate;

        const table = new Table(scope.data);

         somApp = ponder.createSOM({
          table: table,
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
          //fuck da intro!
          console.log('loaded');
        });

        console.log(somApp);
        window.somApp = somApp;


      });


    }
  };
});
