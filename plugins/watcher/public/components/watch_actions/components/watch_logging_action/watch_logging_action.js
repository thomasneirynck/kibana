import { uiModules } from 'ui/modules';
import { WatchActionControllerBase } from '../lib/watch_action_controller_base';
import template from './watch_logging_action.html';
import 'ui/directives/input_focus';

const app = uiModules.get('xpack/watcher');

app.directive('watchLoggingAction', function () {
  return {
    restrict: 'E',
    template: template,
    bindToController: true,
    controllerAs: 'watchLoggingAction',
    controller: class WatchLoggingActionController extends WatchActionControllerBase {
      constructor($scope) {
        super($scope);

        $scope.$watch([
          'action.text'
        ], () => { this.onChange(this.action); });
      }
    }
  };
});
