import expect from 'expect.js';
import { set } from 'lodash';
import sinon from 'sinon';
import checkLicense from '../check_license';

describe('check_license: ', function () {

  let mockLicenseInfo;
  let licenseCheckResult;

  beforeEach(() => {
    mockLicenseInfo = {
      isAvailable: () => true
    };
  });

  context('mockLicenseInfo is not set', () => {
    beforeEach(() => {
      mockLicenseInfo = null;
      licenseCheckResult = checkLicense(mockLicenseInfo);
    });

    it ('should set showGraphFeatures to false', () => {
      expect(licenseCheckResult.showGraphFeatures).to.be(false);
    });

    it ('should set showLicensePage to false', () => {
      expect(licenseCheckResult.showLicensePage).to.be(false);
    });
  });

  context('mockLicenseInfo is set but not available', () => {
    beforeEach(() => {
      mockLicenseInfo = { isAvailable: () => false };
      licenseCheckResult = checkLicense(mockLicenseInfo);
    });

    it ('should set showGraphFeatures to false', () => {
      expect(licenseCheckResult.showGraphFeatures).to.be(false);
    });

    it ('should set showLicensePage to false', () => {
      expect(licenseCheckResult.showLicensePage).to.be(false);
    });
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

    it ('should set showLicensePage to false', () => {
      expect(licenseCheckResult.showLicensePage).to.be(false);
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

      it ('should set showLicensePage to true', () => {
        expect(licenseCheckResult.showLicensePage).to.be(true);
      });
    });

    context('& license is trial or platinum', () => {
      beforeEach(() => {
        const licenseIsOneOfStub = sinon.stub();
        licenseIsOneOfStub.withArgs([ 'basic' ]).returns(false);
        licenseIsOneOfStub.withArgs([ 'trial', 'platinum' ]).returns(true);
        set(mockLicenseInfo, 'license.isOneOf', licenseIsOneOfStub);
        set(mockLicenseInfo, 'license.getType', () => { return 'platinum'; });
      });

      context('&license is active', () => {
        beforeEach(() => {
          set(mockLicenseInfo, 'license.isActive', () => { return true; });
          licenseCheckResult = checkLicense(mockLicenseInfo);
        });

        it ('should set isLicenseActive to true', () => {
          expect(licenseCheckResult.isLicenseActive).to.be(true);
        });

        it ('should set showGraphFeatures to true', () => {
          expect(licenseCheckResult.showGraphFeatures).to.be(true);
        });

        it ('should set showLicensePage to false', () => {
          expect(licenseCheckResult.showLicensePage).to.be(false);
        });
      });

      context('& license has expired', () => {
        beforeEach(() => {
          set(mockLicenseInfo, 'license.isActive', () => { return false; });
          licenseCheckResult = checkLicense(mockLicenseInfo);
        });

        it ('should set isLicenseActive to false', () => {
          expect(licenseCheckResult.isLicenseActive).to.be(false);
        });

        it ('should set showGraphFeatures to true', () => {
          expect(licenseCheckResult.showGraphFeatures).to.be(true);
        });

        it ('should set showLicensePage to false', () => {
          expect(licenseCheckResult.showLicensePage).to.be(false);
        });
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

      it ('should set showLicensePage to true', () => {
        expect(licenseCheckResult.showLicensePage).to.be(true);
      });
    });
  });
});
