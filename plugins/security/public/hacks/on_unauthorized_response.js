import { identity } from 'lodash';
import uiModules from 'ui/modules';

function isUnauthorizedResponseAllowed(response) {
  const APIS_ALLOWED_TO_RETURN_UNAUTHORIZED_RESPONSE = [
    '/api/security/v1/login'
  ];

  return APIS_ALLOWED_TO_RETURN_UNAUTHORIZED_RESPONSE.reduce((isAllowed, endpoint) => {
    return isAllowed || response.config.url.includes(endpoint);
  }, false);
}

const module = uiModules.get('security');
module.factory('onUnauthorizedResponse', ($q, $window, chrome) => {
  function interceptor(response, handleResponse) {
    if (response.status === 401 && !isUnauthorizedResponseAllowed(response)) {
      const next = chrome.removeBasePath(`${window.location.pathname}${window.location.hash}`);
      const msg = 'SESSION_EXPIRED';
      $window.location.href = chrome.addBasePath(`/logout?next=${encodeURIComponent(next)}&msg=${encodeURIComponent(msg)}`);
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
