const expect = require('expect.js');
const checkLicense = require('../../../server/lib/check_license');

describe('check_license', function () {

  let mockLicenseInfo;

  beforeEach(function () {
    mockLicenseInfo = {
      mode: 'trial',
      features: {
        reporting: {
          description: 'Reporting for the Elastic Stack',
          enabled: null,
          available: null
        }
      }
    };
  });

  it ('should set enabled to false if the license is of an invalid type', function () {
    mockLicenseInfo.mode = 'basic';
    expect(checkLicense(mockLicenseInfo).check().enabled).to.be(false);
  });

  it ('should set enabled to true for a license where reporting feature set is enabled and available', function () {
    mockLicenseInfo.features.reporting.enabled = true;
    mockLicenseInfo.features.reporting.available = true;
    expect(checkLicense(mockLicenseInfo).check().enabled).to.be(true);
  });

  it ('should set enabled to false for license where reporting feature set is enabled but not available', function () {
    mockLicenseInfo.features.reporting.enabled = true;
    mockLicenseInfo.features.reporting.available = false;
    expect(checkLicense(mockLicenseInfo).check().enabled).to.be(false);
  });

  it ('should set enabled to false for license where reporting feature set is not enabled but available', function () {
    mockLicenseInfo.features.reporting.enabled = false;
    mockLicenseInfo.features.reporting.available = true;
    expect(checkLicense(mockLicenseInfo).check().enabled).to.be(false);
  });

  it ('should set enabled to false for license where reporting feature set is neither enabled nor available', function () {
    mockLicenseInfo.features.reporting.enabled = false;
    mockLicenseInfo.features.reporting.available = false;
    expect(checkLicense(mockLicenseInfo).check().enabled).to.be(false);
  });
});
