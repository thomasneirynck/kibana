export default function checkLicense(xpackLicenseInfo) {

  let loginMessage;

  // If, for some reason, we cannot get license information
  // from Elasticsearch, assume worst-case and lock user
  // at login screen.
  if (!xpackLicenseInfo || !xpackLicenseInfo.isAvailable()) {
    loginMessage = 'Login is currently disabled because the license could not be determined.';
    return {
      showSecurityFeatures: true,
      allowLogin: false,
      loginMessage
    };
  }

  const isLicenseActive = xpackLicenseInfo.license.isActive();
  const isLicenseBasic = xpackLicenseInfo.license.isOneOf(['basic']);
  const isEnabledInES = xpackLicenseInfo.feature('security').isEnabled();

  const showSecurityFeatures = isEnabledInES && !isLicenseBasic;
  const allowLogin = showSecurityFeatures && isLicenseActive;

  if (!allowLogin) {
    if (!isEnabledInES) {
      loginMessage = 'Login is disabled because security has been disabled in Elasticsearch.';
    } else if (isLicenseBasic) {
      loginMessage = 'Your Basic license does not support Security. Please upgrade your license.';
    } else if (!isLicenseActive) {
      loginMessage = 'Login is disabled because your license has expired.';
    }
  }

  return {
    showSecurityFeatures,
    allowLogin,
    loginMessage
  };

};
