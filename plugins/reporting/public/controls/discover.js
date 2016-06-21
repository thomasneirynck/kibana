require('plugins/reporting/services/document_create');
const Notifier = require('ui/notify/notifier');
const navbarExtensions = require('ui/registry/navbar_extensions');
navbarExtensions.register(discoverReportProvider);

function discoverReportProvider(reportingDocumentCreate) {
  const genericNotifier = new Notifier({ location: 'Reporting' });

  return {
    name: 'discoverReport',
    appName: 'discover',
    order: 0,
    template: require('plugins/reporting/controls/export_button.html'),
    link: function discoverReport($scope) {
      $scope.handleClick = function () {
        return reportingDocumentCreate()
        .catch((err) => {
          if (err.message === 'not exportable') {
            return alert('Only saved searches can be exported. Please save your work first.');
          }

          genericNotifier.error(err);
        });
      };
    }
  };
}
