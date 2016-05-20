require('plugins/reporting/services/document_create');
const Notifier = require('ui/notify/notifier');
const navbarExtensions = require('ui/registry/navbar_extensions');
navbarExtensions.register(dashboardReportProvider);

function dashboardReportProvider(reportingEnabled, reportingDocumentCreate) {
  if (!reportingEnabled) return;
  const genericNotifier = new Notifier({ location: 'Reporting' });

  return {
    name: 'dashboardReport',
    appName: 'dashboard',
    order: 0,
    template: require('plugins/reporting/controls/export_button.html'),
    link: function dashboardReport($scope) {
      $scope.handleClick = function () {
        return reportingDocumentCreate()
        .catch((err) => {
          if (err.message === 'not exportable') {
            return alert('Only saved dashboards can be exported. Please save your work first.');
          }

          genericNotifier.error(err);
        });
      };
    }
  };
}
