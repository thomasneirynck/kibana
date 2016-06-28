import { get } from 'lodash';

const XPACK_INFO_KEY = 'xpackMain.info';

export default function XPackInfoProvider($window) {
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
