export default function checkLicense(xpackLicenseInfo) {

  let loginMessage;
  let linksMessage;

  // If, for some reason, we cannot get license information
  // from Elasticsearch, assume worst-case and lock user
  // at login screen.
  if (!xpackLicenseInfo || !xpackLicenseInfo.isAvailable()) {
    loginMessage = 'Login is currently disabled because the license could not be determined. '
    + 'Please check that Elasticsearch is running, then refresh this page.';
    return {
      allowLogin: false,
      showLinks: false,
      loginMessage,
      linksMessage
    };
  }

  const isLicenseActive = xpackLicenseInfo.license.isActive();
  const isLicenseBasic = xpackLicenseInfo.license.isOneOf(['basic']);
  const isEnabledInES = xpackLicenseInfo.feature('security').isEnabled();

  let allowLogin;
  let showLinks;
  if (!isEnabledInES) {
    linksMessage = 'Access is denied because Security is disabled in Elasticsearch.';
    allowLogin = true;
    showLinks = false;
  } else if (isLicenseBasic) {
    loginMessage = 'Your Basic license does not support Security. Please upgrade your license or disable Security in Elasticsearch.';
    linksMessage = loginMessage;
    allowLogin = false;
    showLinks = false;
  } else if (!isLicenseActive) {
    loginMessage = 'Login is disabled because your license has expired. Please extend your license or disable Security in Elasticsearch.';
    linksMessage = 'Access is denied because your license has expired. Please extend your license.';
    allowLogin = false;
    showLinks = false;
  } else {
    allowLogin = true;
    showLinks = true;
  };

  return {
    allowLogin,
    showLinks,
    loginMessage,
    linksMessage
  };

};
