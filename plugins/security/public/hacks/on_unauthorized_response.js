import { identity } from 'lodash';
import uiModules from 'ui/modules';

function isResponseFromLoginApi(response) {
  return response.config.url.contains('/api/security/v1/login');
}

const module = uiModules.get('security');
module.factory('onUnauthorizedResponse', ($q, chrome) => {
  function interceptor(response, handleResponse) {
    if (response.status === 401 && !isResponseFromLoginApi(response)) {
      const basePathRegExp = new RegExp(`^${chrome.getBasePath()}`);
      const next = `${window.location.pathname.replace(basePathRegExp, '')}${window.location.hash}`;
      window.location.href = chrome.addBasePath(`/logout?next=${encodeURIComponent(next)}`);
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
