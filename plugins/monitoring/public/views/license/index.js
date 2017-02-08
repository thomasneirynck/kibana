import { find, get } from 'lodash';
import uiModules from 'ui/modules';
import uiRoutes from'ui/routes';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from './index.html';

uiRoutes.when('/license', {
  template,
  resolve: {
    clusters(Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    }
  }
});

const uiModule = uiModules.get('monitoring', [ 'monitoring/directives' ]);
uiModule.controller('licenseView', ($route, globalState, title, timefilter, $scope, $window) => {
  timefilter.enabled = false;

  $scope.cluster = find($route.current.locals.clusters, { cluster_uuid: globalState.cluster_uuid });

  $scope.isExpired = (new Date()).getTime() > get($scope.cluster, 'license.expiry_date_in_millis');

  $scope.goBack = function () {
    $window.history.back();
  };

  title($scope.cluster, 'License');
});
