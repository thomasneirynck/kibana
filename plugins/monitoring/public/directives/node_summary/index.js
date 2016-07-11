import { get } from 'lodash';
import statusIconClass from '../../lib/status_icon_class';
const mod = require('ui/modules').get('monitoring/directives', []);
const template = require('plugins/monitoring/directives/node_summary/index.html');
mod.directive('monitoringNodeSummary', () => {
  return {
    restrict: 'E',
    template: template,
    scope: { node: '=' },
    link(scope) {
      scope.getOnlineClass = () => {
        const nodeStatus = get(scope, 'node.status');
        if (nodeStatus && nodeStatus.toLowerCase() === 'online') {
          return 'green';
        } else {
          return 'offline';
        }
      };

      scope.getStatusIconClass = () => {
        return statusIconClass(scope.getOnlineClass());
      };
    }
  };
});
