/*
 * Logstash Node Pipeline View
 */
import _ from 'lodash';
import uiRoutes from'ui/routes';
import { uiModules } from 'ui/modules';
import { ajaxErrorHandlersProvider } from 'plugins/monitoring/lib/ajax_error_handler';
import { routeInitProvider } from 'plugins/monitoring/lib/route_init';
import template from './index.html';

function getPageData($injector) {
  const $route = $injector.get('$route');
  const $http = $injector.get('$http');
  const timefilter = $injector.get('timefilter');
  const globalState = $injector.get('globalState');
  const Private = $injector.get('Private');

  const timeBounds = timefilter.getBounds();
  const clusterUuid = globalState.cluster_uuid;
  const pipelineId = $route.current.params.id;
  const pipelineHash = $route.current.params.hash;
  const url = `../api/monitoring/v1/clusters/${clusterUuid}/logstash/pipeline/${pipelineId}/${pipelineHash}`;
  return $http.post(url, {
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    }
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers(err);
  });
}

uiRoutes.when('/logstash/pipelines/:id/:hash', {
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
uiModule.controller('logstashPipeline', ($injector, $scope) => {
  const $route = $injector.get('$route');
  const $executor = $injector.get('$executor');
  const globalState = $injector.get('globalState');
  const title = $injector.get('title');
  const timefilter = $injector.get('timefilter');

  timefilter.enabled = true;

  function setClusters(clusters) {
    $scope.clusters = clusters;
    $scope.cluster = _.find($scope.clusters, { cluster_uuid: globalState.cluster_uuid });
  }
  setClusters($route.current.locals.clusters);
  $scope.pageData = $route.current.locals.pageData;
  title($scope.cluster, `Logstash - Pipeline`);

  $executor.register({
    execute: () => getPageData($injector),
    handleResponse: (response) => {
      $scope.pageData = response;
    }
  });
  $executor.start();
  $scope.$on('$destroy', $executor.destroy);
});
