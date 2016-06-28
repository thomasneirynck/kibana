require('plugins/reporting/directives/export_config');

const navbarExtensions = require('ui/registry/navbar_extensions');

function dashboardReportProvider() {
  return {
    appName: 'dashboard',
    key: 'reporting-dashboard',
    label: 'Reporting',
    template: '<export-config object-type="Dashboard"></export-config>',
    description: 'Dashboard Report',
  };
}

navbarExtensions.register(dashboardReportProvider);