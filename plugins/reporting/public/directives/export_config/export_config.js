import 'plugins/reporting/services/document_control';
import 'plugins/reporting/services/export_types';
import './export_config.less';
import template from 'plugins/reporting/directives/export_config/export_config.html';
import { Notifier } from 'ui/notify/notifier';
import { uiModules } from 'ui/modules';
import { stateMonitorFactory } from 'ui/state_management/state_monitor_factory';
import url from 'url';

const module = uiModules.get('xpack/reporting');

module.directive('exportConfig', (reportingDocumentControl, reportingExportTypes, $location) => {
  const reportingNotifier = new Notifier({ location: 'Reporting' });

  return {
    restrict: 'E',
    scope: {},
    require: ['?^dashboardApp', '?^visualizeApp', '?^discoverApp'],
    controllerAs: 'exportConfig',
    template,
    async link($scope, $el, $attr, controllers) {
      const actualControllers = controllers.filter(c => c !== null);
      if (actualControllers.length !== 1) {
        throw new Error(`Expected there to be 1 controller, but there are ${actualControllers.length}`);
      }
      const controller = actualControllers[0];
      $scope.exportConfig.isDirty = () => controller.appStatus.dirty;
      if (controller.appStatus.dirty) {
        return;
      }

      const exportTypeId = $attr.enabledExportType;
      $scope.exportConfig.exportType = reportingExportTypes.getById(exportTypeId);
      $scope.exportConfig.objectType = $attr.objectType;

      $scope.updateUrls = async () => {
        const path = await reportingDocumentControl.getPath($scope.exportConfig.exportType, controller);
        $scope.exportConfig.relativePath = path;
        $scope.exportConfig.absoluteUrl = url.resolve($location.absUrl(), path);
      };

      await $scope.updateUrls();
    },
    controller($scope, $document, globalState) {
      const stateMonitor = stateMonitorFactory.create(globalState);
      stateMonitor.onChange(() => {
        if ($scope.exportConfig.isDirty()) {
          return;
        }

        $scope.updateUrls();
      });
      $scope.$on('$destroy', () => stateMonitor.destroy());

      this.export = (relativePath) => {
        reportingDocumentControl.create(relativePath)
        .then(() => {
          reportingNotifier.info(`${this.objectType} generation has been queued. You can track its progress under Management.`);
        })
        .catch((err) => {
          if (err.message === 'not exportable') {
            return reportingNotifier.warning('Only saved dashboards can be exported. Please save your work first.');
          }

          reportingNotifier.error(err);
        });
      };

      this.copyToClipboard = selector => {
        // Select the text to be copied. If the copy fails, the user can easily copy it manually.
        const copyTextarea = $document.find(selector)[0];
        copyTextarea.select();

        try {
          const isCopied = document.execCommand('copy');
          if (isCopied) {
            reportingNotifier.info('URL copied to clipboard.');
          } else {
            reportingNotifier.info('URL selected. Press Ctrl+C to copy.');
          }
        } catch (err) {
          reportingNotifier.info('URL selected. Press Ctrl+C to copy.');
        }
      };
    }
  };
});
