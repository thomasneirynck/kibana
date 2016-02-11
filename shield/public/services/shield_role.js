import 'angular-resource';
import uiModules from 'ui/modules';

const module = uiModules.get('shield/roles', ['ngResource']);
module.service('ShieldRole', ($resource) => {
  return $resource('../api/shield/v1/roles/:name', {
    name: '@name'
  });
});
