import 'angular-resource';
import uiModules from 'ui/modules';

const module = uiModules.get('shield', ['ngResource']);
module.service('ShieldRole', ($resource) => {
  return $resource('../api/security/v1/roles/:name', {
    name: '@name'
  });
});
