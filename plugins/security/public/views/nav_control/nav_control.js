import {constant} from 'lodash';
import registry from 'ui/registry/chrome_nav_controls';
import uiModules from 'ui/modules';
import template from 'plugins/security/views/nav_control/nav_control.html';
import 'plugins/security/services/me';
import chrome from 'ui/chrome';

if (chrome.getInjected('showSecurityFeatures')) {
  registry.register(constant({
    name: 'security',
    order: 1000,
    template
  }));

  const module = uiModules.get('security', []);
  module.controller('securityNavController', ($scope, securityMe) => {
    $scope.me = null;
    securityMe.get().then((me) => {
      $scope.me = me;
    });
  });
}
