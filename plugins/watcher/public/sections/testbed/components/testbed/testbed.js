import { uiModules } from 'ui/modules';
import template from './testbed.html';
import './testbed.less';
import 'plugins/watcher/services/fields';

const app = uiModules.get('xpack/watcher');

app.directive('testbed', function ($injector) {
  const service = $injector.get('watcherFieldsService');

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

      loadFields = () => {
        this.fields = undefined;
        const indexes = this.indexPatterns ? this.indexPatterns.split(',') : [];
        service.getFields(indexes)
        .then((fields) => {
          this.fields = fields;
        });
      }
    }
  };
});
