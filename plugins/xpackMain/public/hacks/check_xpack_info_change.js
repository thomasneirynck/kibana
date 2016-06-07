import uiModules from 'ui/modules';

const module = uiModules.get('xpackMain', []);

module.factory('checkXPackInfoChange', ($window, $injector) => {
  let _isInfoUpdateInProgress = false;
  return {
    response: (response) => {

      // If another instance of this response interceptor is
      // already updating the info and signature, continue on
      // to avoid an infinite loop
      if (_isInfoUpdateInProgress) {
        return response;
      }

      // Get xpack info signature in response; if it's empty, continue on...
      const signatureFromServer = response.headers('kbn-xpack-sig');
      if (!signatureFromServer) {
        return response;
      }

      // Get xpack info signature from local storage
      const localSignature = $window.localStorage.getItem('xpackMain.infoSignature');

      // If they are the same, nothing to do; continue on...
      if (localSignature === signatureFromServer) {
        return response;
      }

      // Signatures differ so xpack info has changed on Kibana
      // server. Fetch it and update local info + signature.
      _isInfoUpdateInProgress = true;
      const $http = $injector.get('$http'); // To prevent circular dependency Angular error
      return $http.get('../api/xpack/v1/info')
      .then((xpackInfoResponse) => {
        $window.localStorage.setItem('xpackMain.info', JSON.stringify(xpackInfoResponse.data));
        $window.localStorage.setItem('xpackMain.infoSignature', xpackInfoResponse.headers('kbn-xpack-sig'));
        _isInfoUpdateInProgress = false;
        return response;
      })
      .catch((e) => {
        _isInfoUpdateInProgress = false;
        throw e;
      });
    }
  };
});

module.config(($httpProvider) => {
  $httpProvider.interceptors.push('checkXPackInfoChange');
});
