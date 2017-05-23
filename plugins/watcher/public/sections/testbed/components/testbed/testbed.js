import { uiModules } from 'ui/modules';
import template from './testbed.html';
import './testbed.less';

import 'plugins/watcher/components/flot_chart';

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
        this.data = [
          [ [ 1, 3 ], [ 2, 14.01 ], [ 3.5, 3.14 ] ]
        ];
        this.options = {};
      }
    }
  };
});
