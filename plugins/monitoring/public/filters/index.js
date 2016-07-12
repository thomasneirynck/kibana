import _ from 'lodash';
import moment from 'moment-timezone';
import uiModules from 'ui/modules';
import formatNumber from 'plugins/monitoring/lib/format_number';
import extractIp from 'plugins/monitoring/lib/extract_ip';

const mod = uiModules.get('monitoring/filters', []);
mod.filter('localizedDate', function () {
  return function (input) {
    return moment.tz(input, moment.tz.guess()).format('LLL z');
  };
});

mod.filter('capitalize', function () {
  return function (input) {
    return _.capitalize(input.toLowerCase());
  };
});

mod.filter('formatNumber', function () {
  return formatNumber;
});

mod.filter('extractIp', function () {
  return extractIp;
});
