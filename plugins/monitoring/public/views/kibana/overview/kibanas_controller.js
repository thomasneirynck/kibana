/*
 * Kibana Listing
 */
import _ from 'lodash';
import uiRoutes from'ui/routes';
import uiModules from 'ui/modules';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handlers';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import template from 'plugins/monitoring/views/kibana/overview/kibanas_template.html';

function getPageData(timefilter, globalState, $http, Private, kbnUrl) {
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/kibana`;
  const timeBounds = timefilter.getBounds();

  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    }
  })
  .then(response => {
    const data = response.data;
    // if there's a single instance in the cluster, redirect to Kibana instance page
    if (data.kibanas.length === 1 && kbnUrl) {
      const uuid = _.get(data, 'kibanas[0].kibana.uuid');
      return kbnUrl.redirect(`/kibana/${uuid}`);
    }
    return data;
  })
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers.fatalError(err);
  });
}

uiRoutes.when('/kibana', {
  template,
  resolve: {
    clusters(Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  }
});

const uiModule = uiModules.get('monitoring', [ 'monitoring/directives' ]);
uiModule.controller('kibanas', ($route, globalState, title, Private, $executor, $http, timefilter, $scope) => {
  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;
  title($scope.cluster, 'Kibana');

  $executor.register({
    execute: () => getPageData(timefilter, globalState, $http, Private),
    handleResponse: (response) => $scope.pageData = response
  });
  $executor.start();
  $scope.$on('$destroy', $executor.destroy);
});
