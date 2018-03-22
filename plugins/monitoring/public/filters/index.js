import { capitalize } from 'lodash';
import { uiModules } from 'ui/modules';
import { formatNumber, formatMetric } from 'plugins/monitoring/lib/format_number';
import { extractIp } from 'plugins/monitoring/lib/extract_ip';

const uiModule = uiModules.get('monitoring/filters', []);

uiModule.filter('capitalize', function () {
  return function (input) {
    return capitalize(input.toLowerCase());
  };
});

uiModule.filter('formatNumber', function () {
  return formatNumber;
});

uiModule.filter('formatMetric', function () {
  return formatMetric;
});

uiModule.filter('extractIp', function () {
  return extractIp;
});
