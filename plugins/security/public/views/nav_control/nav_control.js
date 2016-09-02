import {constant} from 'lodash';
import registry from 'ui/registry/chrome_nav_controls';
import uiModules from 'ui/modules';
import template from 'plugins/security/views/nav_control/nav_control.html';
import 'plugins/security/services/shield_user';
import '../account/account';
import PathProvider from 'plugins/xpack_main/services/path';

registry.register(constant({
  name: 'security',
  order: 1000,
  template
}));

const module = uiModules.get('security', ['kibana']);
module.controller('securityNavController', ($scope, ShieldUser, globalNavState, kbnBaseUrl, Private) => {
  if (Private(PathProvider).isLoginOrLogout()) return;

  $scope.user = ShieldUser.getCurrentUser();
  $scope.route = `${kbnBaseUrl}#/account`;

  $scope.formatTooltip = tooltip => {
    // If the sidebar is open then we don't need to show the tooltip.
    if (globalNavState.isOpen()) {
      return;
    }
    return tooltip;
  };
});
