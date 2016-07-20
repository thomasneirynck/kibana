import 'angular-resource';
import 'angular-cookies';
import angular from 'angular';
import uiModules from 'ui/modules';

const module = uiModules.get('security', ['ngResource', 'ngCookies']);
module.service('ShieldUser', ($resource, $cookies, chrome, clientCookieName) => {
  const baseUrl = chrome.addBasePath('/api/security/v1/users/:username');
  const ShieldUser = $resource(baseUrl, {
    username: '@username'
  }, {
    changePassword: {
      method: 'POST',
      url: `${baseUrl}/password`,
      transformRequest: ({password}) => angular.toJson({password})
    }
  });

  ShieldUser.getCurrent = () => {
    const clientCookieValue = $cookies.getObject(clientCookieName);
    if (!clientCookieValue) {
      return;
    }

    return new ShieldUser(clientCookieValue);
  };

  return ShieldUser;
});
