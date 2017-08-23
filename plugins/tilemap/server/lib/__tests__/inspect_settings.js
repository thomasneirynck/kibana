import expect from 'expect.js';
import { inspectSettings } from '../../../server/lib/inspect_settings';

describe('inspectSettings', function () {

  it('should propagate x-pack info', function () {

    const mockSettings = {
      isAvailable: () => true,
      license: {
        getUid: () => 'foobar',
        isActive: () => true,
        isOneOf: () => true
      }
    };

    const licenseInfo = inspectSettings(mockSettings);
    expect(licenseInfo.license.uid).to.equal('foobar');
    expect(licenseInfo.license.active).to.equal(true);
    expect(licenseInfo.license.valid).to.equal(true);

  });

  it('should break when unavailble info', function () {

    const mockSettings = {
      isAvailable: () => false
    };

    const licenseInfo = inspectSettings(mockSettings);
    expect(licenseInfo).to.have.property('message');
    expect(typeof licenseInfo.message === 'string').to.be.ok();

  });


});
