import { identity } from 'lodash';
import uiModules from 'ui/modules';

function isResponseFromLoginApi(response) {
  return response.config.url.includes('/api/security/v1/login');
}

const module = uiModules.get('security');
module.factory('onUnauthorizedResponse', ($q, $window, chrome) => {
  function interceptor(response, handleResponse) {
    if (response.status === 401 && !isResponseFromLoginApi(response)) {
      const next = chrome.removeBasePath(`${window.location.pathname}${window.location.hash}`);
      $window.location.href = chrome.addBasePath(`/logout?next=${encodeURIComponent(next)}`);
      return;
    }
    return handleResponse(response);
  }

  return {
    response: (response) => interceptor(response, identity),
    responseError: (response) => interceptor(response, $q.reject)
  };
});

module.config(($httpProvider) => {
  $httpProvider.interceptors.push('onUnauthorizedResponse');
});
