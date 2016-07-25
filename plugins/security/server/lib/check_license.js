export default function checkLicense(xpackLicenseInfo) {

  let loginMessage;

  // If, for some reason, we cannot get license information
  // from Elasticsearch, assume worst-case and lock user
  // at login screen.
  if (!xpackLicenseInfo || !xpackLicenseInfo.isAvailable()) {
    loginMessage = 'Login is currently disabled because the license could not be determined.';
    return {
      allowLogin: false,
      loginMessage
    };
  }

  const isLicenseActive = xpackLicenseInfo.license.isActive();
  const isLicenseBasic = xpackLicenseInfo.license.isOneOf(['basic']);
  const isEnabledInES = xpackLicenseInfo.feature('security').isEnabled();

  let allowLogin;
  if (!isEnabledInES) {
    loginMessage = 'Login is disabled because security has been disabled in Elasticsearch.';
    allowLogin = false;
  } else if (isLicenseBasic) {
    if (isLicenseActive) {
      loginMessage = 'Your Basic license does not support Security. Please upgrade your license or disable Security in Elasticsearch.';
    } else {
      loginMessage = 'Your Basic license does not support Security. Please extend your license and disable Security in Elasticsearch.';
    }
    allowLogin = false;
  } else if (!isLicenseActive) {
    loginMessage = 'Login is disabled because your license has expired.';
    allowLogin = false;
  } else {
    allowLogin = true;
  };

  return {
    allowLogin,
    loginMessage
  };

};
