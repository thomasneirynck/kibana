import expect from 'expect.js';
import { set } from 'lodash';
import checkLicense from '../../../server/lib/check_license';

describe('check_license', function () {

  let mockLicenseInfo;

  beforeEach(function () {
    mockLicenseInfo = {
      isAvailable: () => true
    };
  });

  it ('should set enabled to false if license information is not set', () => {
    mockLicenseInfo = null;
    expect(checkLicense(mockLicenseInfo).enabled).to.be(false);
  });

  it ('should set enabled to false if license information is set but not available', () => {
    mockLicenseInfo = { isAvailable: () => false };
    expect(checkLicense(mockLicenseInfo).enabled).to.be(false);
  });

  it ('should set enabled to false if the license is not active', () => {
    set(mockLicenseInfo, 'license.isActive', () => { return false; });
    set(mockLicenseInfo, 'license.isOneOf', () => { return true; });
    expect(checkLicense(mockLicenseInfo).enabled).to.be(false);
  });

  it ('should set enabled to false if the license is of an invalid type', () => {
    set(mockLicenseInfo, 'license.isActive', () => { return true; });
    set(mockLicenseInfo, 'license.isOneOf', () => { return false; });
    expect(checkLicense(mockLicenseInfo).enabled).to.be(false);
  });

  it ('should set enabled to true if the license is of a valid type and active', () => {
    set(mockLicenseInfo, 'license.isActive', () => { return true; });
    set(mockLicenseInfo, 'license.isOneOf', () => { return true; });
    expect(checkLicense(mockLicenseInfo).enabled).to.be(true);

  });

});
