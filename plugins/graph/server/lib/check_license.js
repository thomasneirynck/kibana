export default function checkLicense(xpackLicenseInfo) {

  if (!xpackLicenseInfo || !xpackLicenseInfo.isAvailable()) {
    return {
      showAppLink: true,
      enableAppLink: false
    };
  }

  const graphFeature = xpackLicenseInfo.feature('graph');
  if (!graphFeature.isEnabled()) {
    return {
      showAppLink: false
    };
  }

  if (xpackLicenseInfo.license.isOneOf([ 'trial', 'platinum' ])) {
    return {
      showAppLink: true,
      enableAppLink: xpackLicenseInfo.license.isActive()
    };
  }

  return {
    showAppLink: false
  };
}
