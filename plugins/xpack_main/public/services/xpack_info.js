import { get } from 'lodash';
import uiModules from 'ui/modules';

const XPACK_INFO_KEY = 'xpackMain.info';
const XPACK_INFO_SIG_KEY = 'xpackMain.infoSignature';

const module = uiModules.get('xpack_main/services');

module.service('xpackInfo', ($window) => {
  return {
    get(path, defaultValue) {
      const xpackInfoValueInLocalStorage = $window.localStorage.getItem(XPACK_INFO_KEY);
      const xpackInfo = xpackInfoValueInLocalStorage ? JSON.parse(xpackInfoValueInLocalStorage) : {};
      return get(xpackInfo, path, defaultValue);
    },
    set(updatedXPackInfo) {
      $window.localStorage.setItem(XPACK_INFO_KEY, JSON.stringify(updatedXPackInfo));
    },
    clear() {
      $window.localStorage.removeItem(XPACK_INFO_KEY);
    }
  };
});

module.service('xpackInfoSignature', ($window) => {
  return {
    get() {
      return $window.localStorage.getItem(XPACK_INFO_SIG_KEY);
    },
    set(updatedXPackInfoSignature) {
      $window.localStorage.setItem(XPACK_INFO_SIG_KEY, updatedXPackInfoSignature);
    },
    clear() {
      $window.localStorage.removeItem(XPACK_INFO_SIG_KEY);
    }
  };
});
