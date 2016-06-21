export default function checkLicense(xpackLicenseInfo) {

  if (!xpackLicenseInfo || !xpackLicenseInfo.isAvailable()) {
    return {
      showGraphFeatures: false,
      showLicensePage: false
    };
  }

  const graphFeature = xpackLicenseInfo.feature('graph');
  if (!graphFeature.isEnabled()) {
    return {
      showGraphFeatures: false,
      showLicensePage: false
    };
  }

  if (xpackLicenseInfo.license.isOneOf([ 'basic' ])) {
    return {
      showGraphFeatures: true,
      showLicensePage: true
    };
  }

  if (xpackLicenseInfo.license.isOneOf([ 'trial', 'platinum' ])) {
    return {
      showGraphFeatures: true,
      showLicensePage: false
    };
  }

  if (xpackLicenseInfo.license.isOneOf([ 'standard', 'gold' ])) {
    return {
      showGraphFeatures: false,
      showLicensePage: true
    };
  }
}
