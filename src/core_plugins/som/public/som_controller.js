import uiModules from 'ui/modules';

const module = uiModules.get('kibana/som', ['kibana']);
module.controller('KbnSomController', function ($scope) {

  $scope.$watch('esResponse', function (response) {

    console.log('som controller responding!', response);



  });
});

