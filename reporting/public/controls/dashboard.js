require('ui/registry/navbar_extensions').register(dashboardReportProvider);

function dashboardReportProvider(Private) {
  const ConfigTemplate = require('ui/ConfigTemplate');
  const appInfo = Private(require('plugins/reporting/app_info'));

  return {
    name: 'dashboardReport',
    appName: 'dashboard',
    order: 0,
    template: require('plugins/reporting/controls/dashboard.html'),
    link: function dashboardReport($scope, $el) {
      // $scope.configTemplate = new ConfigTemplate({
      //   report: require('plugins/reporting/dashboard_report.html'),
      // });
      console.log('scope', $scope);

      $scope.handleClick = function () {
        const info = appInfo('dashboard');
        // debugger;
      };
    }
  };
}
