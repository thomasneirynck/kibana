import { identity } from 'lodash';
import uiModules from 'ui/modules';
import chrome from 'ui/chrome';
import { convertKeysToCamelCaseDeep } from '../../../../server/lib/key_case_convertor';

const module = uiModules.get('xpack_main', []);

module.factory('checkXPackInfoChange', ($q, $window, $injector) => {
  let _isInfoUpdateInProgress = false;

  function interceptor(response, handleResponse) {
    // If another instance of this response interceptor is
    // already updating the info and signature, continue on
    // to avoid an infinite loop
    if (_isInfoUpdateInProgress) {
      return handleResponse(response);
    }

    // Get xpack info signature in response; if it's empty, continue on...
    const signatureFromServer = response.headers('kbn-xpack-sig');

    // Get xpack info signature from local storage
    const localSignature = $window.localStorage.getItem('xpackMain.infoSignature');

    // If they are the same, nothing to do; continue on...
    if (localSignature === signatureFromServer) {
      return handleResponse(response);
    }

    // Signatures differ so xpack info has changed on Kibana
    // server. Fetch it and update local info + signature.
    _isInfoUpdateInProgress = true;
    const $http = $injector.get('$http'); // To prevent circular dependency Angular error
    return $http.get(chrome.addBasePath('/api/xpack/v1/info'))
    .then((xpackInfoResponse) => {
      $window.localStorage.setItem('xpackMain.info', JSON.stringify(convertKeysToCamelCaseDeep(xpackInfoResponse.data)));
      $window.localStorage.setItem('xpackMain.infoSignature', xpackInfoResponse.headers('kbn-xpack-sig'));
      _isInfoUpdateInProgress = false;
      return handleResponse(response);
    })
    .catch(() => {
      _isInfoUpdateInProgress = false;
      return handleResponse(response);
    });
  }

  return {
    response: (response) => interceptor(response, identity),
    responseError: (response) => interceptor(response, $q.reject)
  };
});

module.config(($httpProvider) => {
  $httpProvider.interceptors.push('checkXPackInfoChange');
});
