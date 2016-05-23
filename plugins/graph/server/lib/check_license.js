export default function checkLicense(xpackLicenseInfo) {

  if (!xpackLicenseInfo) {
    return {
      showGraphFeatures: false,
      showUpsellUser: false
    };
  }

  const graphFeature = xpackLicenseInfo.feature('graph');
  if (!graphFeature.isEnabled()) {
    return {
      showGraphFeatures: false,
      shouldUpsellUser: false
    };
  }

  const commonLicenseInfo = {
    licenseType: xpackLicenseInfo.license.getType(),
    isLicenseActive: xpackLicenseInfo.license.isActive()
  };

  if (xpackLicenseInfo.license.isOneOf([ 'basic' ])) {
    return {
      showGraphFeatures: true,
      shouldUpsellUser: true,
      ...commonLicenseInfo
    };
  }

  if (xpackLicenseInfo.license.isOneOf([ 'trial', 'platinum' ])) {
    return {
      showGraphFeatures: true,
      shouldUpsellUser: !xpackLicenseInfo.license.isActive(),
      ...commonLicenseInfo
    };
  }

  if (xpackLicenseInfo.license.isOneOf([ 'standard', 'gold' ])) {
    return {
      showGraphFeatures: false,
      shouldUpsellUser: true,
      ...commonLicenseInfo
    };
  }
}
