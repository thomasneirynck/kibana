import { identity } from 'lodash';
import uiModules from 'ui/modules';
import 'plugins/security/services/login_page';
import 'plugins/security/services/auto_logout';

function isUnauthorizedResponseAllowed(response) {
  const API_WHITELIST = [
    '/api/security/v1/login'
  ];

  const url = response.config.url;
  return API_WHITELIST.some(api => url.includes(api));
}

const module = uiModules.get('security');
module.factory('onUnauthorizedResponse', ($q, $window, $injector, LoginPage, autoLogout) => {
  function interceptorFactory(responseHandler) {
    return function interceptor(response) {
      if (response.status === 401 && !isUnauthorizedResponseAllowed(response) && !LoginPage.isOnLoginPage()) return autoLogout();
      return responseHandler(response);
    };
  }

  return {
    response: interceptorFactory(identity),
    responseError: interceptorFactory($q.reject)
  };
});

module.config(($httpProvider) => {
  $httpProvider.interceptors.push('onUnauthorizedResponse');
});
