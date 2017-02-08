/**
 * Controller for Index Listing
 */
import { find, partial } from 'lodash';
import uiRoutes from 'ui/routes';
import uiModules from 'ui/modules';
import routeInitProvider from 'plugins/monitoring/lib/route_init';
import ajaxErrorHandlersProvider from 'plugins/monitoring/lib/ajax_error_handler';
import template from './index.html';

function getPageData(timefilter, globalState, $http, Private, features) {
  const timeBounds = timefilter.getBounds();
  const url = `../api/monitoring/v1/clusters/${globalState.cluster_uuid}/elasticsearch/indices`;
  const showSystemIndices = features.isEnabled('showSystemIndices', false);

  return $http.post(url, {
    showSystemIndices,
    timeRange: {
      min: timeBounds.min.toISOString(),
      max: timeBounds.max.toISOString()
    },
    listingMetrics: [
      'index_document_count',
      'index_size',
      'index_search_request_rate',
      'index_request_rate_primary'
    ]
  })
  .then(response => response.data)
  .catch((err) => {
    const ajaxErrorHandlers = Private(ajaxErrorHandlersProvider);
    return ajaxErrorHandlers(err);
  });
}

uiRoutes.when('/elasticsearch/indices', {
  template,
  resolve: {
    clusters: function (Private) {
      const routeInit = Private(routeInitProvider);
      return routeInit();
    },
    pageData: getPageData
  }
});

const uiModule = uiModules.get('monitoring', [ 'monitoring/directives' ]);
uiModule.controller('indices', ($route, globalState, timefilter, $http, title, Private, $executor, features, $scope) => {
  timefilter.enabled = true;

  $scope.cluster = find($route.current.locals.clusters, { cluster_uuid: globalState.cluster_uuid });
  $scope.pageData = $route.current.locals.pageData;

  const callPageData = partial(getPageData, timefilter, globalState, $http, Private, features);
  // Control whether system indices shown in the index listing
  // shown by default, and setting is stored in localStorage
  $scope.showSystemIndices = features.isEnabled('showSystemIndices', false);
  $scope.toggleShowSystemIndices = (isChecked) => {
    // flip the boolean
    $scope.showSystemIndices = isChecked;
    // preserve setting in localStorage
    features.update('showSystemIndices', isChecked);
    // update the page
    callPageData().then((pageData) => $scope.pageData = pageData);
  };

  title($scope.cluster, 'Elasticsearch - Indices');

  $executor.register({
    execute: () => callPageData(),
    handleResponse: (pageData) => $scope.pageData = pageData
  });

  $executor.start();

  $scope.$on('$destroy', $executor.destroy);
});
