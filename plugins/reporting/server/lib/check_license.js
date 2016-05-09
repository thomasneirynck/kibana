import {includes} from 'lodash';

const VALID_LICENSE_MODES_TO_ENABLE_REPORTING = [
  'trial',
  'standard',
  'gold',
  'platinum'
];

module.exports = function (xpackLicenseInfo) {

  const isLicenseModeValid = function () {
    return includes(VALID_LICENSE_MODES_TO_ENABLE_REPORTING, xpackLicenseInfo.mode);
  };

  return {
    check: function () {

      // Check license type (mode)
      if (!isLicenseModeValid()) {
        return {
          enabled: false,
          message: 'Reporting is not enabled by this type of license.'
        };
      }

      // Check reporting feature enabled and available
      const reportingFeature = xpackLicenseInfo.features.reporting;
      if (reportingFeature.enabled && reportingFeature.available) {
        return {
          enabled: true,
          message: 'Valid license found and reporting feature is enabled.'
        };
      } else if (reportingFeature.enabled && !reportingFeature.available) {
        return {
          enabled: false,
          message: 'Reporting feature is not available (license may be expired).'
        };
      } else if (!reportingFeature.enabled && reportingFeature.available) {
        return {
          enabled: false,
          message: 'Valid license found but reporting feature is not enabled.'
        };
      } else {
        return {
          enabled: false,
          message: 'Reporting feature is not available (license may be expired) and not enabled.'
        };
      }
    }
  };
};
