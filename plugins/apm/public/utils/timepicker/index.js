import moment from 'moment';
import { uiModules } from 'ui/modules';
import 'ui/chrome';
import 'ui/autoload/all';
import { set } from 'lodash';
import { updateTimePicker } from '../../store/urlParams';

let globalTimefilter;
let globalKibanaConfig;
let currentInterval;

// hack to wait for angular template to be ready
function waitForAngularReady() {
  return new Promise(resolve => {
    const checkInterval = setInterval(() => {
      const hasElm = !!document.querySelector('#react-apm-breadcrumbs');
      if (hasElm) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 10);
  });
}

export function initTimepicker(history, dispatch, callback) {
  const waitForKibanaReady = new Promise(resolve => {
    uiModules.get('kibana').run((uiSettings, config) => {
      globalKibanaConfig = config;

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
    resolve();
  });

  uiModules
    .get('app/apm', [])
    .controller('TimePickerController', ($scope, timefilter, globalState) => {
      // Add APM feedback menu
      // TODO: move this somewhere else
      $scope.topNavMenu = [];
      $scope.topNavMenu.push({
        key: 'APM feedback',
        description: 'APM feedback',
        tooltip: 'Provide feedback on APM',
        template: require('../../templates/feedback_menu.html')
      });

      history.listen(() => {
        updateRefreshRate(dispatch, timefilter);
        globalState.fetch();
      });
      timefilter.setTime = (from, to) => {
        timefilter.time.from = moment(from).toISOString();
        timefilter.time.to = moment(to).toISOString();
        $scope.$apply();
      };
      timefilter.enableTimeRangeSelector();
      timefilter.enableAutoRefreshSelector();
      timefilter.init();

      updateRefreshRate(dispatch, timefilter);

      timefilter.on('update', () => dispatch(getAction(timefilter)));

      // hack to access timefilter outside Angular
      globalTimefilter = timefilter;

      Promise.all([waitForAngularReady, waitForKibanaReady]).then(callback);
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

export function getKibanaConfig() {
  if (!globalKibanaConfig) {
    throw new Error(
      'KibanaConfig must be initialized before calling getConfig'
    );
  }
  return globalKibanaConfig;
}
