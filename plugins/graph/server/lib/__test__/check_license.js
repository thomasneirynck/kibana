import expect from 'expect.js';
import { set } from 'lodash';
import sinon from 'sinon';
import checkLicense from '../check_license';

describe('check_license: ', function () {

  let mockLicenseInfo;
  let licenseCheckResult;

  beforeEach(() => {
    mockLicenseInfo = {};
  });

  context('graph is disabled in Elasticsearch', () => {
    beforeEach(() => {
      set(mockLicenseInfo, 'feature', sinon.stub().withArgs('graph').returns({
        isEnabled: () => { return false; }
      }));
      licenseCheckResult = checkLicense(mockLicenseInfo);
    });

    it ('should set showGraphFeatures to false', () => {
      expect(licenseCheckResult.showGraphFeatures).to.be(false);
    });

    it ('should set shouldUpsellUser to false', () => {
      expect(licenseCheckResult.shouldUpsellUser).to.be(false);
    });
  });

  context('graph is enabled in Elasticsearch', () => {
    beforeEach(() => {
      set(mockLicenseInfo, 'feature', sinon.stub().withArgs('graph').returns({
        isEnabled: () => { return true; }
      }));
    });

    context('& license is basic', () => {
      beforeEach(() => {
        set(mockLicenseInfo, 'license.isOneOf', sinon.stub().withArgs([ 'basic' ]).returns(true));
        set(mockLicenseInfo, 'license.getType', () => { return 'basic'; });
        set(mockLicenseInfo, 'license.isActive', () => { return true; });
        licenseCheckResult = checkLicense(mockLicenseInfo);
      });

      it ('should set showGraphFeatures to true', () => {
        expect(licenseCheckResult.showGraphFeatures).to.be(true);
      });

      it ('should set shouldUpsellUser to true', () => {
        expect(licenseCheckResult.shouldUpsellUser).to.be(true);
      });
    });

    context('& license is trial or platinum', () => {
      beforeEach(() => {
        const licenseIsOneOfStub = sinon.stub();
        licenseIsOneOfStub.withArgs([ 'basic' ]).returns(false);
        licenseIsOneOfStub.withArgs([ 'trial', 'platinum' ]).returns(true);
        set(mockLicenseInfo, 'license.isOneOf', licenseIsOneOfStub);
        set(mockLicenseInfo, 'license.isActive', () => { return true; });
        set(mockLicenseInfo, 'license.getType', () => { return 'platinum'; });
        licenseCheckResult = checkLicense(mockLicenseInfo);
      });

      it ('should set showGraphFeatures to true', () => {
        expect(licenseCheckResult.showGraphFeatures).to.be(true);
      });

      it ('should set shouldUpsellUser to false', () => {
        expect(licenseCheckResult.shouldUpsellUser).to.be(false);
      });
    });

    context('& license is standard or gold', () => {
      beforeEach(() => {
        const licenseIsOneOfStub = sinon.stub();
        licenseIsOneOfStub.withArgs([ 'basic' ]).returns(false);
        licenseIsOneOfStub.withArgs([ 'trial', 'platinum' ]).returns(false);
        licenseIsOneOfStub.withArgs([ 'standard', 'gold' ]).returns(true);
        set(mockLicenseInfo, 'license.isOneOf', licenseIsOneOfStub);
        set(mockLicenseInfo, 'license.isActive', () => { return true; });
        set(mockLicenseInfo, 'license.getType', () => { return 'gold'; });
        licenseCheckResult = checkLicense(mockLicenseInfo);
      });

      it ('should set showGraphFeatures to false', () => {
        expect(licenseCheckResult.showGraphFeatures).to.be(false);
      });

      it ('should set shouldUpsellUser to true', () => {
        expect(licenseCheckResult.shouldUpsellUser).to.be(true);
      });
    });
  });
});
