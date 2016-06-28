import { get } from 'lodash';

const XPACK_INFO_KEY = 'xpackMain.info';
const XPACK_INFO_SIG_KEY = 'xpackMain.infoSignature';

export function XPackInfoProvider($window) {
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
}

export function XPackInfoSignatureProvider($window) {
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
}
