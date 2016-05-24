export default function checkLicense(xpackLicenseInfo) {

  if (!xpackLicenseInfo) {
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

  const commonLicenseInfo = {
    licenseType: xpackLicenseInfo.license.getType(),
    isLicenseActive: xpackLicenseInfo.license.isActive()
  };

  if (xpackLicenseInfo.license.isOneOf([ 'basic' ])) {
    return {
      showGraphFeatures: true,
      showLicensePage: true,
      ...commonLicenseInfo
    };
  }

  if (xpackLicenseInfo.license.isOneOf([ 'trial', 'platinum' ])) {
    return {
      showGraphFeatures: true,
      showLicensePage: false,
      ...commonLicenseInfo
    };
  }

  if (xpackLicenseInfo.license.isOneOf([ 'standard', 'gold' ])) {
    return {
      showGraphFeatures: false,
      showLicensePage: true,
      ...commonLicenseInfo
    };
  }
}
