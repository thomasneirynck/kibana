require('ui/registry/navbar_extensions').register(dashboardReportProvider);

function dashboardReportProvider(Private, $window) {
  const appInfo = Private(require('plugins/reporting/app_info'));

  return {
    name: 'dashboardReport',
    appName: 'dashboard',
    order: 0,
    template: require('plugins/reporting/controls/dashboard.html'),
    link: function dashboardReport($scope, $el) {
      $scope.handleClick = function () {
        const info = appInfo('dashboard');

        if (!info.exportable) {
          alert('Only saved dashboards can be exported');
          return;
        }

        $window.open(info.reportUrl, info.objectId);
      };
    }
  };
}
