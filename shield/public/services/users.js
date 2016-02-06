import uiModules from 'ui/modules';

const module = uiModules.get('shield/users', ['ngResource']);
module.service('shieldUsers', ($resource) => {
  return $resource('../api/shield/v1/users/:username', {
    username: '@username'
  });
});
