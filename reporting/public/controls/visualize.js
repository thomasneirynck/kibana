require('ui/registry/navbar_extensions').register(visualizeReportProvider);

function visualizeReportProvider(Private, $window) {
  const appInfo = Private(require('plugins/reporting/app_info'));

  return {
    name: 'visualizeReport',
    appName: 'visualize',
    order: 0,
    template: require('plugins/reporting/controls/export_button.html'),
    link: function visualizeReport($scope, $el) {
      $scope.handleClick = function () {
        const info = appInfo();

        if (!info.exportable) {
          alert('Only saved visualizations can be exported');
          return;
        }

        $window.open(info.reportUrl, info.objectId);
      };
    }
  };
}
