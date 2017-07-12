import { uiModules } from 'ui/modules';
import { DirtyPrompt } from './dirty_prompt';

uiModules.get('xpack/watcher')
.factory('xpackWatcherDirtyPrompt', ($injector) => {
  const $window = $injector.get('$window');
  const confirmModal = $injector.get('confirmModal');
  const $rootScope = $injector.get('$rootScope');

  return new DirtyPrompt($window, $rootScope, confirmModal);
});
