import {constant} from 'lodash';
import registry from 'ui/registry/chrome_nav_controls';
import uiModules from 'ui/modules';
import template from 'plugins/security/views/nav_control/nav_control.html';
import chrome from 'ui/chrome';
import 'angular-cookies';

if (chrome.getInjected('showSecurityFeatures')) {
  registry.register(constant({
    name: 'security',
    order: 1000,
    template
  }));

  const module = uiModules.get('security', ['ngCookies']);
  module.controller('securityNavController', ($scope, $cookies, clientCookieName) => {
    $scope.me = $cookies.getObject(clientCookieName);
  });
}
