/* eslint-disable
  import/no-extraneous-dependencies,
  import/no-unresolved,
  import/extensions,
  no-param-reassign
*/
import moment from 'moment';
import { uiModules } from 'ui/modules';
import 'ui/chrome';
import 'ui/autoload/all';
import { set } from 'lodash';
import createHistory from 'history/createHashHistory';

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
      history.listen(() => globalState.fetch());
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
