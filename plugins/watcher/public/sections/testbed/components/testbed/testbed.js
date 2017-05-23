import { uiModules } from 'ui/modules';
import template from './testbed.html';
import './testbed.less';

import moment from 'moment';
import 'plugins/watcher/components/threshold_preview_chart';

function inMsSinceEpoch(datetime) {
  return moment(datetime).valueOf();
}

const app = uiModules.get('xpack/watcher');

app.directive('testbed', function () {

  return {
    restrict: 'E',
    template: template,
    scope: {
      data: '='
    },
    bindToController: true,
    controllerAs: 'testbed',
    controller: class TestbedController {
      constructor() {
        this.chart1Series = [
          // [ xTimestampInMsSinceEpoch, yValue ],
          [ inMsSinceEpoch('2017-03-06T03:15:23.131Z'), 100 ],
          [ inMsSinceEpoch('2017-04-04T16:08:43.208Z'), 55 ],
          [ inMsSinceEpoch('2017-04-22T06:22:03.820Z'), 80 ],
          [ inMsSinceEpoch('2017-05-18T21:15:00.323Z'), 50 ]
        ];
        this.chart1ThresholdValue = 75;

        this.chart2Series = [
          // [ xTimestampInMsSinceEpoch, yValue ],
          [ inMsSinceEpoch('2017-05-18T17:35:00.323Z'), 100 ],
          [ inMsSinceEpoch('2017-05-18T19:01:40.208Z'), 55],
          [ inMsSinceEpoch('2017-05-18T20:25:00.323Z'), 80],
          [ inMsSinceEpoch('2017-05-18T21:15:00.323Z'), 50]
        ];
        this.chart2ThresholdValue = 75;
      }
    }
  };
});
