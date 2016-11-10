import uiModules from 'ui/modules';
import uiChrome from 'ui/chrome';

const module = uiModules.get('security', []);
module.service('loginState', ($http) => {
  return {
    get: () => {
      return $http.get(uiChrome.addBasePath(`/api/security/v1/login_state`))
      .then(response => response.data);
    }
  };
});
