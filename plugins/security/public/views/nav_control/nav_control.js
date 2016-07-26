import {constant} from 'lodash';
import registry from 'ui/registry/chrome_nav_controls';
import uiModules from 'ui/modules';
import template from 'plugins/security/views/nav_control/nav_control.html';
import 'plugins/security/services/shield_user';
import '../account/account';

registry.register(constant({
  name: 'security',
  order: 1000,
  template
}));

const module = uiModules.get('security', []);
module.controller('securityNavController', ($scope, ShieldUser, globalNavState) => {
  $scope.me = ShieldUser.getCurrent;

  $scope.formatTooltip = tooltip => {
    // If the sidebar is open then we don't need to show the tooltip.
    if (globalNavState.isOpen()) {
      return;
    }
    return tooltip;
  };
});
