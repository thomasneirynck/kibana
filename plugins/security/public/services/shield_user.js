import 'angular-resource';
import uiModules from 'ui/modules';

const module = uiModules.get('shield', ['ngResource']);
module.service('ShieldUser', ($resource) => {
  return $resource('../api/security/v1/users/:username', {
    username: '@username'
  });
});
