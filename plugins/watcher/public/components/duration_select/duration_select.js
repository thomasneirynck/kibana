import { uiModules } from 'ui/modules';
import { TIME_UNITS } from 'plugins/watcher/constants';
import template from './duration_select.html';
import './duration_select.less';
import moment from 'moment';

const app = uiModules.get('xpack/watcher');

app.directive('durationSelect', function () {
  return {
    require: '^form',
    scope: {
      durationId: '@',
      minimumUnit: '=',
      minimumSize: '=',
      unit: '=',
      size: '='
    },
    template,
    replace: true,
    controllerAs: 'durationSelect',
    bindToController: true,
    link: function ($scope, $element, $attrs, $ctrl) {
      $scope.durationSelect.form = $ctrl;
    },
    controller: class DurationSelectController {
      constructor($scope) {
        this.timeUnits = TIME_UNITS;

        $scope.$watchMulti([
          'durationSelect.minimumSize',
          'durationSelect.minimumUnit'
        ], ([minimumSize, minimumUnit]) => {
          this.minimumDuration = moment.duration(Number(minimumSize), minimumUnit).asMilliseconds();
          this.checkValidity();
        });

        $scope.$watchMulti([
          `durationSelect.size`,
          `durationSelect.unit`
        ], ([size, unit]) => {
          this.duration = moment.duration(Number(size), unit).asMilliseconds();
          this.checkValidity();
        });
      }

      checkValidity = () => {
        const isValid = this.duration >= this.minimumDuration;
        const sizeName = this.sizeName;
        const unitName = this.unitName;

        this.form[sizeName].$setTouched(true);
        this.form[unitName].$setTouched(true);

        this.form[sizeName].$setValidity('minimumDuration', isValid);
        this.form[unitName].$setValidity('minimumDuration', isValid);
      }

      get unitName() {
        return `durationSelect_${this.durationId}_unit`;
      }

      get sizeName() {
        return `durationSelect_${this.durationId}_size`;
      }
    }
  };
});
