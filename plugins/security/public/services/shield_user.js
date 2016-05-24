import 'angular-resource';
import angular from 'angular';
import uiModules from 'ui/modules';

const module = uiModules.get('shield', ['ngResource']);
module.service('ShieldUser', ($resource, chrome) => {
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

  return ShieldUser;
});
