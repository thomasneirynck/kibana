import expect from 'expect.js';
import { set } from 'lodash';
import sinon from 'sinon';
import { checkLicense } from '../check_license';
import { LOGIN_DISABLED_MESSAGE } from '../login_disabled_message';

describe('check_license', function () {

  let mockLicenseInfo;

  beforeEach(function () {
    mockLicenseInfo = {
      isAvailable: () => true
    };
  });

  it ('should show login page but not allow login if license information is not set', () => {
    mockLicenseInfo = null;
    const licenseCheckResults = checkLicense(mockLicenseInfo);

    expect(licenseCheckResults.showLogin).to.be(true);
    expect(licenseCheckResults.allowLogin).to.be(false);
    expect(licenseCheckResults.showLinks).to.be(false);
  });

  it ('should show login page but not allow login if license information is set but not available', () => {
    mockLicenseInfo = { isAvailable: () => false };
    const licenseCheckResults = checkLicense(mockLicenseInfo);

    expect(licenseCheckResults.showLogin).to.be(true);
    expect(licenseCheckResults.allowLogin).to.be(false);
    expect(licenseCheckResults.showLinks).to.be(false);
  });

  it ('should not show login page or other security elements if license is basic or security is disabled in Elasticsearch', () => {
    set(mockLicenseInfo, 'license.isOneOf', sinon.stub().withArgs([ 'basic' ]).returns(true));
    set(mockLicenseInfo, 'license.isActive', () => { return 'irrelevant'; });
    set(mockLicenseInfo, 'feature', sinon.stub().withArgs('security').returns({
      isEnabled: () => { return 'irrelevant'; }
    }));

    expect(checkLicense(mockLicenseInfo).showLogin).to.be(false);
    expect(checkLicense(mockLicenseInfo).allowLogin).to.be(null);
    expect(checkLicense(mockLicenseInfo).showLinks).to.be(false);
  });

  it ('should show login page but not allow login if license has expired, security is enabled in ES and license is not basic', () => {
    set(mockLicenseInfo, 'license.isActive', () => { return false; });
    set(mockLicenseInfo, 'feature', sinon.stub().withArgs('security').returns({
      isEnabled: () => { return true; }
    }));
    set(mockLicenseInfo, 'license.isOneOf', sinon.stub().withArgs([ 'basic' ]).returns(false));

    expect(checkLicense(mockLicenseInfo).showLogin).to.be(true);
    expect(checkLicense(mockLicenseInfo).allowLogin).to.be(false);
    expect(checkLicense(mockLicenseInfo).showLinks).to.be(false);
  });

  describe('login message', () => {

    it ('should tell users if login is disabled because license information could not be determined ', () => {
      mockLicenseInfo = null;
      expect(checkLicense(mockLicenseInfo).loginMessage).to.contain(LOGIN_DISABLED_MESSAGE);
    });

    it ('should tell users if login is disabled because license has expired', () => {
      set(mockLicenseInfo, 'license.isActive', () => { return false; });
      set(mockLicenseInfo, 'feature', sinon.stub().withArgs('security').returns({
        isEnabled: () => { return true; }
      }));
      set(mockLicenseInfo, 'license.isOneOf', sinon.stub().withArgs([ 'basic' ]).returns(false));

      const expectedMessage = 'Login is disabled because your license has expired. '
      + 'Please extend your license or disable Security in Elasticsearch.';
      expect(checkLicense(mockLicenseInfo).loginMessage).to.be(expectedMessage);
    });

  });
});
