import moment from 'moment';
import { uiModules } from 'ui/modules';
import 'ui/chrome';
import 'ui/autoload/all';
import { set } from 'lodash';
import createHistory from 'history/createHashHistory';
import { setupRoutes } from '../../services/breadcrumbs';
import { legacyDecodeURIComponent, toQuery } from '../../utils/url';

const routes = {
  '/': 'APM',
  '/:appName': {
    url: params => `/${params.appName}/transactions`,
    label: params => params.appName
  },
  '/:appName/errors': 'Errors',
  '/:appName/errors/:groupId': params => params.groupId,
  '/:appName/transactions': {
    skip: true
  },
  '/:appName/transactions/:transactionType': params => params.transactionType,
  '/:appName/transactions/:transactionType/:transactionName': params =>
    legacyDecodeURIComponent(params.transactionName)
};
const getBreadcrumbs = setupRoutes(routes);

let globalTimefilter;

export function initTimepicker(callback) {
  const history = createHistory();
  uiModules.get('kibana').run(uiSettings => {
    set(
      uiSettings,
      'defaults.timepicker:timeDefaults.value',
      JSON.stringify({
        from: 'now-24h',
        to: 'now',
        mode: 'quick'
      })
    );
  });
  uiModules
    .get('app/apm', [])
    .controller('TimePickerController', ($scope, timefilter, globalState) => {
      $scope.breadcrumbs = getBreadcrumbs(history.location.pathname);
      $scope.searchQueryTime = toQuery(history.location.search)._g;

      history.listen(location => {
        $scope.$apply(() => {
          $scope.breadcrumbs = getBreadcrumbs(location.pathname);
          $scope.searchQueryTime = toQuery(history.location.search)._g;
        });
        globalState.fetch();
      });
      timefilter.setTime = (from, to) => {
        timefilter.time.from = moment(from).toISOString();
        timefilter.time.to = moment(to).toISOString();
        $scope.$apply();
      };
      timefilter.enabled = true;
      timefilter.init();
      callback(timefilter);

      // hack to access timefilter outside Angular
      globalTimefilter = timefilter;
    });
}

export function getTimefilter() {
  if (!globalTimefilter) {
    throw new Error(
      'Timepicker must be initialized before calling getTimefilter'
    );
  }
  return globalTimefilter;
}
