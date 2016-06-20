require('plugins/reporting/directives/export_config');

const navbarExtensions = require('ui/registry/navbar_extensions');

function visualizeReportProvider(reportingEnabled) {
  if (!reportingEnabled) return;

  return {
    appName: 'visualize',
    key: 'reporting-visualize',
    label: 'Reporting',
    template: '<export-config object-type="Visualization"></export-config>',
    description: 'Visualization Report',
  };
}

navbarExtensions.register(visualizeReportProvider);