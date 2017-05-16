import { uiModules } from 'ui/modules';
import template from './testbed.html';
import './testbed.less';

import 'ui/react_components';

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
      }

      onFilter = (newFilter) => {
        this.filter = newFilter;
      }
    }
  };
});
