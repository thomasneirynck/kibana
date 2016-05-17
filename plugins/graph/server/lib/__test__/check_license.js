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
        licenseCheckResult = checkLicense(mockLicenseInfo);
      });

      it ('should set showGraphFeatures to true', () => {
        expect(licenseCheckResult.showGraphFeatures).to.be(true);
      });

      it ('should set shouldUpsellUser to false', () => {
        expect(licenseCheckResult.shouldUpsellUser).to.be(false);
      });

      context('& license has expired', () => {
        beforeEach(() => {
          set(mockLicenseInfo, 'license.isActive', () => { return false; });
          licenseCheckResult = checkLicense(mockLicenseInfo);
        });

        it ('should set shouldUpsellUser to true', () => {
          expect(licenseCheckResult.shouldUpsellUser).to.be(true);
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


/*

  it ('should set showGraphFeatures to tru to false if security is disabled in Elasticsearch', () => {
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
    set(mockLicenseInfo, 'license.isOneOf', sinon.stub().withArgs([ 'basic' ]).returns(true));
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
    set(mockLicenseInfo, 'license.isActive', () => { return false; });
    set(mockLicenseInfo, 'feature', () => {
      return {
        isEnabled: () => {
          return true;
        }
      };
    });
    set(mockLicenseInfo, 'license.isOneOf', sinon.stub().withArgs([ 'basic' ]).returns(false));

    expect(checkLicense(mockLicenseInfo).allowLogin).to.be(false);
  });
});
*/
