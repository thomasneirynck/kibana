import { get } from 'lodash';
const module = require('ui/modules').get('xpack_main/services');

const XPACK_INFO_KEY = 'xpackMain.info';
const XPACK_INFO_SIG_KEY = 'xpackMain.infoSignature';

module.service('xpackInfo', ($window) => {
  return {
    get(path, defaultValue) {
      const xpackInfo = JSON.parse($window.localStorage.getItem(XPACK_INFO_KEY)) || {};
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
