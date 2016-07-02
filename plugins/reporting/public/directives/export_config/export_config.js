require('plugins/reporting/services/document_control');
require('./export_config.less');
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';

const Clipboard = require('clipboard');
const template = require('plugins/reporting/directives/export_config/export_config.html');
const Notifier = require('ui/notify/notifier');
const module = require('ui/modules').get('xpack/reporting');

module.directive('exportConfig', (reportingDocumentControl, Private) => {
  const xpackInfo = Private(XPackInfoProvider);
  const reportingNotifier = new Notifier({ location: 'Reporting' });

  return {
    restrict: 'E',
    scope: {},
    controllerAs: 'exportConfig',
    template,
    link($scope, $el, $attr) {
      $scope.showLinks = xpackInfo.get('features.reporting.showLinks', false);
      $scope.enableLinks = xpackInfo.get('features.reporting.enableLinks', false);
      $scope.disabledMessage = xpackInfo.get('features.reporting.message');
      $scope.exportConfig.selectedType = 'printablePdf';
      $scope.exportConfig.name = $attr.name;
      $scope.exportConfig.objectType = $attr.objectType;
      $scope.exportConfig.exportable = reportingDocumentControl.isExportable();

      $scope.exportConfig.exportTypes = {
        printablePdf: {
          name: 'PDF',
          link: reportingDocumentControl.getUrl(),
        }
      };

      const clipboard = new Clipboard($el.find('button.clipboard-button')[0], {
        text: function () {
          return $el.find('input.clipboard-text').attr('value');
        }
      });

      clipboard.on('success', function () {
        reportingNotifier.info('URL copied to clipboard.');
      });

      clipboard.on('error', () => {
        reportingNotifier.info('URL selected. Press Ctrl+C to copy.');
      });

      $scope.$on('$destroy', () => {
        clipboard.destroy();
      });
    },
    controller() {
      this.export = (type) => {
        switch (type) {
          case 'printablePdf':
            return reportingDocumentControl.create()
            .then(() => {
              reportingNotifier.info(`${this.objectType} generation has been queued. You can track its progress under Management.`);
            })
            .catch((err) => {
              if (err.message === 'not exportable') {
                return reportingNotifier.warning('Only saved dashboards can be exported. Please save your work first.');
              }

              reportingNotifier.error(err);
            });
          default:
            reportingNotifier.error(`Invalid export type specified: ${type}`);

        }
      };
    }
  };
});
