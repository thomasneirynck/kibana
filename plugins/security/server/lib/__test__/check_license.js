import expect from 'expect.js';
import { set } from 'lodash';
import sinon from 'sinon';
import checkLicense from '../check_license';

describe('check_license', function () {

  let mockLicenseInfo;

  beforeEach(function () {
    mockLicenseInfo = {
      isAvailable: () => true
    };
  });

  it ('should set allowLogin to false if license information is not set', () => {
    mockLicenseInfo = null;
    const licenseCheckResults = checkLicense(mockLicenseInfo);
    expect(licenseCheckResults.allowLogin).to.be(false);
  });

  it ('should set allowLogin to false if license information is set but not available', () => {
    mockLicenseInfo = { isAvailable: () => false };
    const licenseCheckResults = checkLicense(mockLicenseInfo);
    expect(licenseCheckResults.allowLogin).to.be(false);
  });

  it ('should set allowLogin to false if security is disabled in Elasticsearch', () => {
    set(mockLicenseInfo, 'feature', sinon.stub().withArgs('security').returns({
      isEnabled: () => { return false; }
    }));
    set(mockLicenseInfo, 'license.isActive', () => { return 'irrelevant'; });
    set(mockLicenseInfo, 'license.isOneOf', () => { return 'irrelevant'; });

    expect(checkLicense(mockLicenseInfo).allowLogin).to.be(false);
  });

  it ('should set allowLogin to false if license is basic', () => {
    set(mockLicenseInfo, 'license.isOneOf', sinon.stub().withArgs([ 'basic' ]).returns(true));
    set(mockLicenseInfo, 'license.isActive', () => { return 'irrelevant'; });
    set(mockLicenseInfo, 'feature', sinon.stub().withArgs('security').returns({
      isEnabled: () => { return 'irrelevant'; }
    }));

    expect(checkLicense(mockLicenseInfo).allowLogin).to.be(false);
  });

  it ('should set allowLogin to false if license has expired even if security is enabled in Elasticsearch and license is not basic', () => {
    set(mockLicenseInfo, 'license.isActive', () => { return false; });
    set(mockLicenseInfo, 'feature', sinon.stub().withArgs('security').returns({
      isEnabled: () => { return true; }
    }));
    set(mockLicenseInfo, 'license.isOneOf', sinon.stub().withArgs([ 'basic' ]).returns(false));

    expect(checkLicense(mockLicenseInfo).allowLogin).to.be(false);
  });

  describe('login message', () => {

    it ('should tell users if login is disabled because license information could not be determined ', () => {
      mockLicenseInfo = null;

      const expectedMessage = 'Login is currently disabled because the license could not be determined.';
      expect(checkLicense(mockLicenseInfo).loginMessage).to.contain(expectedMessage);
    });

    it ('should tell users if login is disabled because security is disabled in Elasticsearch ', () => {
      set(mockLicenseInfo, 'license.isActive', () => { return true; });
      set(mockLicenseInfo, 'feature', sinon.stub().withArgs('security').returns({
        isEnabled: () => { return false; }
      }));
      set(mockLicenseInfo, 'license.isOneOf', sinon.stub().withArgs([ 'basic' ]).returns(false));

      const expectedMessage = 'Login is disabled because security has been disabled in Elasticsearch.';
      expect(checkLicense(mockLicenseInfo).loginMessage).to.contain(expectedMessage);
    });

    it ('should tell users if login is disabled because license is basic', () => {
      set(mockLicenseInfo, 'license.isActive', () => { return true; });
      set(mockLicenseInfo, 'feature', sinon.stub().withArgs('security').returns({
        isEnabled: () => { return true; }
      }));
      set(mockLicenseInfo, 'license.isOneOf', sinon.stub().withArgs([ 'basic' ]).returns(true));

      const expectedMessage = 'Your Basic license does not support Security. Please upgrade your license.';
      expect(checkLicense(mockLicenseInfo).loginMessage).to.contain(expectedMessage);
    });

    it ('should tell users if login is disabled because license has expired', () => {
      set(mockLicenseInfo, 'license.isActive', () => { return false; });
      set(mockLicenseInfo, 'feature', sinon.stub().withArgs('security').returns({
        isEnabled: () => { return true; }
      }));
      set(mockLicenseInfo, 'license.isOneOf', sinon.stub().withArgs([ 'basic' ]).returns(false));

      const expectedMessage = 'Login is disabled because your license has expired.';
      expect(checkLicense(mockLicenseInfo).loginMessage).to.contain(expectedMessage);
    });

  });
});
