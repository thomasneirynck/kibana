import 'plugins/reporting/directives/export_config';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import navbarExtensions from 'ui/registry/navbar_extensions';
import { VisualizeConstants } from 'plugins/kibana/visualize/visualize_constants';

function visualizeReportProvider(Private, $location) {
  const xpackInfo = Private(XPackInfoProvider);
  return {
    appName: 'visualize',

    key: 'reporting-visualize',
    label: 'Reporting',
    template: '<export-config object-type="Visualization"></export-config>',
    description: 'Visualization Report',
    hideButton: () => (
      $location.path() === VisualizeConstants.LANDING_PAGE_URL
      || !xpackInfo.get('features.reporting.showLinks', false)
    ),
    disableButton: () => !xpackInfo.get('features.reporting.enableLinks', false),
    tooltip: () => xpackInfo.get('features.reporting.message')
  };
}

navbarExtensions.register(visualizeReportProvider);
