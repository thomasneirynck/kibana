const XPACK_INFO_SIG_KEY = 'xpackMain.infoSignature';

export default function XPackInfoSignatureProvider($window) {
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
