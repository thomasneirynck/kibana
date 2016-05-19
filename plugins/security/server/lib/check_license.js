export default function checkLicense(xpackLicenseInfo) {

  // If, for some reason, we cannot get license information
  // from Elasticsearch, assume worst-case and lock user
  // at login screen.
  if (!xpackLicenseInfo) {
    return {
      showSecurityFeatures: true,
      allowLogin: false
    };
  }

  const isLicenseActive = xpackLicenseInfo.license.isActive();
  const isLicenseBasic = xpackLicenseInfo.license.isOneOf(['basic']);
  const isEnabledInES = xpackLicenseInfo.feature('security').isEnabled();

  const showSecurityFeatures = isEnabledInES && !isLicenseBasic;
  const allowLogin = showSecurityFeatures && isLicenseActive;

  return {
    showSecurityFeatures,
    allowLogin
  };

};
