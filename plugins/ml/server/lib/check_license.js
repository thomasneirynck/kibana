export default function checkLicense(xpackLicenseInfo) {

  if (!xpackLicenseInfo || !xpackLicenseInfo.isAvailable()) {
    return {
      showAppLink: true,
      enableAppLink: false,
      message: 'Machine Learning is unavailable - license information is not available at this time.'
    };
  }

  const mlFeature = xpackLicenseInfo.feature('ml');
  if (!mlFeature.isEnabled()) {
    return {
      showAppLink: false,
      enableAppLink: false,
      message: 'Machine Learning is unavailable'
    };
  }

  const isLicenseActive = xpackLicenseInfo.license.isActive();
  let message;
  if (!isLicenseActive) {
    message = 'Machine Learning is unavailable - license has expired.';
  }

  if (xpackLicenseInfo.license.isOneOf([ 'trial', 'platinum' ])) {
    return {
      showAppLink: true,
      enableAppLink: isLicenseActive,
      message
    };
  }

  message = `Machine Learning is unavailable for the current ${xpackLicenseInfo.license.getType()} license. Please upgrade your license.`;
  return {
    showAppLink: false,
    enableAppLink: false,
    message
  };
}
