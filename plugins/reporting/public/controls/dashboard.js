const navbarExtensions = require('ui/registry/navbar_extensions');
navbarExtensions.register(dashboardReportProvider);

function dashboardReportProvider(Private, $window, reportingEnabled) {
  if (!reportingEnabled) return;

  const appInfo = Private(require('plugins/reporting/app_info'));

  return {
    name: 'dashboardReport',
    appName: 'dashboard',
    order: 0,
    template: require('plugins/reporting/controls/export_button.html'),
    link: function dashboardReport($scope) {
      $scope.handleClick = function () {
        const info = appInfo();

        if (!info.exportable) {
          alert('Only saved dashboards can be exported');
          return;
        }

        $window.open(info.reportUrl, info.objectId);
      };
    }
  };
}
