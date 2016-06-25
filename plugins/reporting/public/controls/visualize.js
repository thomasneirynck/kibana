import 'plugins/xpack_main/services/xpack_info';
require('plugins/reporting/services/document_create');
const Notifier = require('ui/notify/notifier');
const navbarExtensions = require('ui/registry/navbar_extensions');
navbarExtensions.register(visualizeReportProvider);

function visualizeReportProvider(reportingDocumentCreate, xpackInfo) {
  const genericNotifier = new Notifier({ location: 'Reporting' });

  return {
    name: 'visualizeReport',
    appName: 'visualize',
    order: 0,
    template: require('plugins/reporting/controls/export_button.html'),
    link: function visualizeReport($scope) {
      $scope.showLinks = xpackInfo.get('features.reporting.showLinks', false);
      $scope.enableLinks = xpackInfo.get('features.reporting.enableLinks', false);
      $scope.disabledMessage = xpackInfo.get('features.reporting.message');
      $scope.handleClick = function () {
        return reportingDocumentCreate()
        .catch((err) => {
          if (err.message === 'not exportable') {
            return alert('Only saved visualizations can be exported. Please save your work first.');
          }

          genericNotifier.error(err);
        });
      };
    }
  };
}
