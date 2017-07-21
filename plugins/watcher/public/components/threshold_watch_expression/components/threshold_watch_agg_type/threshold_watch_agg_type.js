import { uiModules } from 'ui/modules';
import template from './threshold_watch_agg_type.html';
import { ThresholdWatchBaseController } from '../threshold_watch_base';
import 'plugins/watcher/services/html_id_generator';

const app = uiModules.get('xpack/watcher');

app.directive('thresholdWatchAggType', function ($injector) {
  const htmlIdGeneratorFactory = $injector.get('xpackWatcherHtmlIdGeneratorFactory');

  return {
    restrict: 'E',
    template: template,
    scope: {
      itemId: '@',
      aggTypes: '=',
      aggType: '=',
      isOpen: '=',
      isVisible: '=',
      onOpen: '=',
      onClose: '=',
      onChange: '=',
      onValid: '=',
      onInvalid: '=',
      onDirty: '=',
      onPristine: '='
    },
    bindToController: true,
    controllerAs: 'thresholdWatchAggType',
    controller: class ThresholdWatchAggTypeController extends ThresholdWatchBaseController {
      constructor($scope) {
        super($scope);

        this.makeId = htmlIdGeneratorFactory.create();

        $scope.$watch('thresholdWatchAggType.aggType', this.onChange);

        $scope.$watch('thresholdWatchAggType.form.$valid', this.checkValidity);
        $scope.$watch('thresholdWatchAggType.form.$dirty', this.checkDirty);

        this.itemDescription = 'When';
      }

      get itemValue() {
        return this.aggType ? this.aggType.label : '';
      }
    }
  };
});
