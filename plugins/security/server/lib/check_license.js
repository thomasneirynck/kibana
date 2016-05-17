export default function checkLicense(xpackLicenseInfo) {

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
