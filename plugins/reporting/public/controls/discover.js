require('plugins/reporting/directives/export_config');

const navbarExtensions = require('ui/registry/navbar_extensions');

function discoverReportProvider(reportingEnabled) {
  if (!reportingEnabled) return;

  return {
    appName: 'discover',
    key: 'reporting-discover',
    label: 'Reporting',
    template: '<export-config object-type="Search"></export-config>',
    description: 'Search Report',
  };
}

navbarExtensions.register(discoverReportProvider);
