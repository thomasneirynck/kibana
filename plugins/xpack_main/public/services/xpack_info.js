import { get } from 'lodash';
import chrome from 'ui/chrome';
import XPackInfoSignatureProvider from 'plugins/xpack_main/services/xpack_info_signature';
import { convertKeysToCamelCaseDeep } from '../../../../server/lib/key_case_converter';

const XPACK_INFO_KEY = 'xpackMain.info';

export default function XPackInfoProvider($window, $injector, Private) {
  const xpackInfoSignature = Private(XPackInfoSignatureProvider);

  const xpackInfoObj = {
    get(path, defaultValue) {
      const xpackInfoValueInLocalStorage = $window.sessionStorage.getItem(XPACK_INFO_KEY);
      const xpackInfo = xpackInfoValueInLocalStorage ? JSON.parse(xpackInfoValueInLocalStorage) : {};
      return get(xpackInfo, path, defaultValue);
    },
    set(updatedXPackInfo) {
      $window.sessionStorage.setItem(XPACK_INFO_KEY, JSON.stringify(updatedXPackInfo));
    },
    clear() {
      $window.sessionStorage.removeItem(XPACK_INFO_KEY);
    },
    refresh() {
      const $http = $injector.get('$http');
      return $http.get(chrome.addBasePath('/api/xpack/v1/info'))
      .catch(() => {
        xpackInfoObj.clear();
        xpackInfoSignature.clear();
        return Promise.reject();
      })
      .then((xpackInfoResponse) => {
        xpackInfoObj.set(convertKeysToCamelCaseDeep(xpackInfoResponse.data));
        xpackInfoSignature.set(xpackInfoResponse.headers('kbn-xpack-sig'));
      });
    }
  };

  return xpackInfoObj;
}
