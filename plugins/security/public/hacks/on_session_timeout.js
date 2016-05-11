import _ from 'lodash';
import uiModules from 'ui/modules';

const WARNING_DURATION = 60 * 1000;

const module = uiModules.get('shield', []);
module.config(($httpProvider) => {
  $httpProvider.interceptors.push(($timeout, $window, $q, $injector, sessionTimeout, Notifier) => {
    const notifier = new Notifier();
    let promise;
    let notification;

    function interceptor(response, handleResponse) {
      if (promise != null) $timeout.cancel(promise);
      if (notification) notification.clear();

      // Don't set up the notification if the user is unauthenticated
      if (response.status === 401) return handleResponse(response);

      const options = {
        type: 'warning',
        content: 'You will soon be logged out due to inactivity. Click OK to resume.',
        icon: 'warning',
        title: 'Warning',
        lifetime: Math.min(sessionTimeout, WARNING_DURATION),
        actions: ['accept']
      };

      promise = $timeout(() => {
        notification = notifier.add(options, (action) => {
          if (action === 'accept') {
            // Make a simple request to keep the session alive
            const $http = $injector.get('$http');
            $http.get('../api/security/v1/me').catch(() => $window.location.reload());
          } else {
            // The session has expired by now, so reloading will return to the login screen with the appropriate "next"
            // parameter set
            $window.location.reload();
          }
        });
      }, sessionTimeout - WARNING_DURATION);

      return handleResponse(response);
    }

    return {
      response: (response) => interceptor(response, _.identity),
      responseError: (response) => interceptor(response, $q.reject)
    };
  });
});
