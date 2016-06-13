require('plugins/reporting/directives/export_config');

const navbarExtensions = require('ui/registry/navbar_extensions');
navbarExtensions.register(dashboardReportProvider);

function dashboardReportProvider(reportingEnabled) {
  if (!reportingEnabled) return;

  return {
    appName: 'dashboard',
    key: 'reporting-dashboard',
    label: 'Reporting',
    template: '<export-config object-type="Dashboard"></export-config>',
    description: 'Dashboard Report',
  };
}
