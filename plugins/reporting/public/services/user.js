import XPackInfoProvider from 'plugins/xpack_main/services/xpack_info';

export default function User(Private, $injector) {
  const xpackInfo = Private(XPackInfoProvider);
  return {
    /**
     * @return null, if security is disabled OR undefined if user is not signed-in OR signed-in user object
     **/
    getCurrent() {
      // If security is disabled, return early because we can't use the
      // ShieldUser service as it won't be available
      if (!xpackInfo.get('features.security.allowLogin')) {
        return null;
      }

      const ShieldUser = $injector.get('ShieldUser');
      return ShieldUser.getCurrent();
    }
  };
}
