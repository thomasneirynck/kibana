import moment from 'moment';
import { uiModules } from 'ui/modules';
import 'ui/chrome';
import 'ui/autoload/all';
import { debounce, set } from 'lodash';
import { setupRoutes } from '../../services/breadcrumbs';
import { legacyDecodeURIComponent, toQuery } from '../../utils/url';
import { updateTimePicker } from '../../store/urlParams';

const routes = {
  '/': 'APM',
  '/getting-started': 'Getting Started',
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
let currentInterval;

export function initTimepicker(history, dispatch, callback) {
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
        updateRefreshRate(dispatch, timefilter);

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

      updateRefreshRate(dispatch, timefilter);

      timefilter.on(
        'update',
        debounce(() => dispatch(getAction(timefilter)), 10)
      );

      // hack to access timefilter outside Angular
      globalTimefilter = timefilter;
      callback();
    });
}

function getAction(timefilter) {
  return updateTimePicker({
    min: timefilter.getBounds().min.toISOString(),
    max: timefilter.getBounds().max.toISOString()
  });
}

function updateRefreshRate(dispatch, timefilter) {
  const refreshInterval = timefilter.refreshInterval.value;
  if (currentInterval) {
    clearInterval(currentInterval);
  }

  if (refreshInterval > 0 && !timefilter.refreshInterval.pause) {
    currentInterval = setInterval(
      () => dispatch(getAction(timefilter)),
      refreshInterval
    );
  }
}

export function getTimefilter() {
  if (!globalTimefilter) {
    throw new Error(
      'Timepicker must be initialized before calling getTimefilter'
    );
  }
  return globalTimefilter;
}
