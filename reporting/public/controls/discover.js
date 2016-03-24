const navbarExtensions = require('ui/registry/navbar_extensions');
navbarExtensions.register(discoverReportProvider);

function discoverReportProvider(Private, $window, reportingEnabled) {
  if (!reportingEnabled) return;

  const appInfo = Private(require('plugins/reporting/app_info'));

  return {
    name: 'discoverReport',
    appName: 'discover',
    order: 0,
    template: require('plugins/reporting/controls/export_button.html'),
    link: function discoverReport($scope, $el) {
      $scope.handleClick = function () {
        const info = appInfo();

        if (!info.exportable) {
          alert('Only saved searches can be exported');
          return;
        }

        $window.open(info.reportUrl, info.objectId);
      };
    }
  };
}
