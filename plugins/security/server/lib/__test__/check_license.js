import expect from 'expect.js';
import { set } from 'lodash';
import checkLicense from '../check_license';

describe('check_license', function () {

  let mockLicenseInfo;

  beforeEach(function () {
    mockLicenseInfo = {};
  });

  it ('should set showSecurityFeatures to false if security is disabled in Elasticsearch', () => {
    set(mockLicenseInfo, 'feature', () => {
      return {
        isEnabled: () => {
          return false;
        }
      };
    });
    set(mockLicenseInfo, 'license.isActive', () => { return 'irrelevant'; });
    set(mockLicenseInfo, 'license.isOneOf', () => { return 'irrelevant'; });

    expect(checkLicense(mockLicenseInfo).showSecurityFeatures).to.be(false);
  });

  it ('should set showSecurityFeatures to false if license is basic', () => {
    set(mockLicenseInfo, 'license.isOneOf', () => { return true; });
    set(mockLicenseInfo, 'license.isActive', () => { return 'irrelevant'; });
    set(mockLicenseInfo, 'feature', () => {
      return {
        isEnabled: () => {
          return 'irrelevant';
        }
      };
    });

    expect(checkLicense(mockLicenseInfo).showSecurityFeatures).to.be(false);
  });

  it ('should set allowLogin to false if license has expired even if security is enabled in Elasticsearch and license is not basic', () => {
    set(mockLicenseInfo, 'feature', () => {
      return {
        isEnabled: () => {
          return true;
        }
      };
    });
    set(mockLicenseInfo, 'license.isOneOf', () => { return false; });
    set(mockLicenseInfo, 'license.isActive', () => { return false; });

    expect(checkLicense(mockLicenseInfo).allowLogin).to.be(false);
  });
});
