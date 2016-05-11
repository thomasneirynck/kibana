module.exports = function (xpackLicenseInfo) {

  const VALID_LICENSE_MODES_TO_ENABLE_REPORTING = [
    'trial',
    'standard',
    'gold',
    'platinum'
  ];

  return {
    check: function () {

      const isLicenseActive = xpackLicenseInfo.license.isActive();
      if (!isLicenseActive) {
        return {
          enabled: false,
          message: 'License is not active.'
        };
      }

      const isLicenseModeValid = xpackLicenseInfo.license.isOneOf(VALID_LICENSE_MODES_TO_ENABLE_REPORTING);
      if (!isLicenseModeValid) {
        return {
          enabled: false,
          message: 'Reporting is not enabled by this license.'
        };
      }

      // License is valid and active
      return {
        enabled: true,
        message: 'Valid license found.'
      };
    }
  };
};
