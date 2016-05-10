import _ from 'lodash';
import uiModules from 'ui/modules';

const module = uiModules.get('shield', []);
module.config(($httpProvider) => {
  $httpProvider.interceptors.push(($timeout, $window, sessionTimeout) => {
    let promise;

    function interceptor(response) {
      if (promise != null) $timeout.cancel(promise);
      promise = $timeout(() => {
        $window.location.reload();
      }, sessionTimeout);

      return response;
    }

    return {
      response: interceptor,
      responseError: interceptor
    };
  });
});
