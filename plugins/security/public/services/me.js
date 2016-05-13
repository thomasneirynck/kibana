import uiModules from 'ui/modules';

const module = uiModules.get('security', []);
module.service('securityMe', ($http, $q) => {
  let me;
  return {
    get() {
      if (me) return $q.resolve(me);
      return $http.get('../api/security/v1/me').then(({data}) => me = data);
    }
  };
});
