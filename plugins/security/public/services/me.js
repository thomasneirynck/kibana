import uiModules from 'ui/modules';

const module = uiModules.get('security', []);
module.service('securityMe', ($http, $q, chrome) => {
  let me;
  return {
    get() {
      if (me) return $q.resolve(me);
      return $http.get(chrome.addBasePath('/api/security/v1/me')).then(({data}) => me = data);
    }
  };
});
