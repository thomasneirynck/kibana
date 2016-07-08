import { get, capitalize } from 'lodash';
import statusIconClass from '../../lib/status_icon_class';
const mod = require('ui/modules').get('monitoring/directives', []);
const template = require('plugins/monitoring/directives/kibana_summary/index.html');
mod.directive('monitoringKibanaSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { kibana: '=' },
    link(scope) {
      scope.getSummaryStatus = () => {
        const online = get(scope, 'kibana.availability');
        let status = get(scope, 'kibana.status');
        if (!online) {
          status = 'offline';
        }
        return status;
      };

      scope.getSummaryStatusText = () => {
        return `Instance: ${capitalize(scope.getSummaryStatus())}`;
      };

      scope.getStatusIconClass = () => {
        return statusIconClass(scope.getSummaryStatus());
      };
    }
  };
});
