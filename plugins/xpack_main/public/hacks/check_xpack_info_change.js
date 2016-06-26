import { identity } from 'lodash';
import uiModules from 'ui/modules';
import chrome from 'ui/chrome';
import { convertKeysToCamelCaseDeep } from '../../../../server/lib/key_case_converter';
import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';
import XPackInfoSignatureProvider from 'plugins/xpack_main/services/xpack_info_signature';

const module = uiModules.get('xpack_main', []);

module.factory('checkXPackInfoChange', ($q, $injector, Private) => {
  const xpackInfo = Private(XPackInfoProvider);
  const xpackInfoSignature = Private(XPackInfoSignatureProvider);

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
    const localSignature = xpackInfoSignature.get();

    // If they are the same, nothing to do; continue on...
    if (localSignature === signatureFromServer) {
      return handleResponse(response);
    }

    // Signatures differ so xpack info has changed on Kibana
    // server. Fetch it and update local info + signature.
    _isInfoUpdateInProgress = true;
    const $http = $injector.get('$http'); // To prevent circular dependency Angular error
    return $http.get(chrome.addBasePath('/api/xpack/v1/info'))
    .catch(() => {
      xpackInfo.clear();
      xpackInfoSignature.clear();
      _isInfoUpdateInProgress = false;
      return handleResponse(response);
    })
    .then((xpackInfoResponse) => {
      xpackInfo.set(convertKeysToCamelCaseDeep(xpackInfoResponse.data));
      xpackInfoSignature.set(xpackInfoResponse.headers('kbn-xpack-sig'));
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
