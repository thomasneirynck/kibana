require('plugins/reporting/services/document_create');
require('./export_config.less');

const template = require('plugins/reporting/directives/export_config/export_config.html');
const Notifier = require('ui/notify/notifier');
const module = require('ui/modules').get('xpack/reporting');

module.directive('exportConfig', (reportingDocumentCreate) => {
  const reportingNotifier = new Notifier({ location: 'Reporting' });

  return {
    restrict: 'E',
    scope: {},
    controllerAs: 'exportConfig',
    template,
    link($scope, $el, $attr) {
      $scope.exportConfig.name = $attr.name;
    },
    controller() {
      this.selectedType = 'pdf';
      this.exportTypes = {
        pdf: {
          name: 'PDF',
          link: 'http://testing',
        }
      };

      this.export = (type) => {
        switch (type) {
          case 'pdf':
            return reportingDocumentCreate()
            .then(() => {
              reportingNotifier.info(`${this.objectType} generation has been queued. You can track its progress under Settings.`);
            })
            .catch((err) => {
              if (err.message === 'not exportable') {
                return reportingNotifier.warning('Only saved dashboards can be exported. Please save your work first.');
              }

              reportingNotifier.error(err);
            });
        }
      };
    }
  };
});
