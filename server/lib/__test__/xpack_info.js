import { createHash } from 'crypto';
const expect = require('expect.js');
const Bluebird = require('bluebird');
import moment from 'moment';
const xpackInfo = require('../xpack_info');

describe('xpack_info', function () {

  let mockClient;
  let mockServer;
  let clientResponse;
  const pollFrequencyInMillis = 10;

  function setClientResponse(obj) {
    clientResponse = Bluebird.resolve(obj);
  }

  function xpackInfoTest(response) {
    setClientResponse(response);
    return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
    .then(info => {
      info.stopPolling();
      return info;
    });
  }

  beforeEach(function () {
    mockClient = {
      transport: {
        request: () => Bluebird.resolve(clientResponse)
      }
    };
    mockServer = {
      log: () => {}
    };
  });

  describe('license', function () {
    describe('isActive()', function () {
      it ('returns true if the license is active', function () {
        return xpackInfoTest({ license: { status: 'active' }})
        .then(info => expect(info.license.isActive()).to.be(true));
      });
      it ('returns false if the license has expired', function () {
        return xpackInfoTest({ license: { status: 'expired' }})
        .then(info => expect(info.license.isActive()).to.be(false));
      });
    });

    describe('expiresSoon()', function () {
      it ('returns true if the license will expire within 30 days', function () {
        const licenseExpirationDate = moment.utc().add('20', 'days');
        return xpackInfoTest({ license: { expiry_date_in_millis: licenseExpirationDate.valueOf() }})
        .then(info => expect(info.license.expiresSoon()).to.be(true));
      });
      it ('returns false if the license will expire after 30 days', function () {
        const licenseExpirationDate = moment.utc().add('40', 'days');
        return xpackInfoTest({ license: { expiry_date_in_millis: licenseExpirationDate.valueOf() }})
        .then(info => expect(info.license.expiresSoon()).to.be(false));
      });
    });

    describe('getExpiryDateInMillis()', function () {
      it ('returns the expiration date in milliseconds', function () {
        const licenseExpirationDateInMillis = 1465527717231; // 2016-06-10T03:01:57.231Z
        return xpackInfoTest({ license: { expiry_date_in_millis: licenseExpirationDateInMillis }})
        .then(info => expect(info.license.getExpiryDateInMillis()).to.be(licenseExpirationDateInMillis));
      });
    });

    describe('isOneOf()', function () {
      it ('returns true if the license is the single given mode', function () {
        return xpackInfoTest({ license: { mode: 'gold' }})
        .then(info => expect(info.license.isOneOf('gold')).to.be(true));
      });
      it ('returns true if the license is one of multiple given modes', function () {
        return xpackInfoTest({ license: { mode: 'gold' }})
        .then(info => expect(info.license.isOneOf([ 'trial', 'gold' ])).to.be(true));
      });
      it ('returns false if the license is not one of the multiple given modes', function () {
        return xpackInfoTest({ license: { mode: 'basic' }})
        .then(info => expect(info.license.isOneOf([ 'trial', 'gold' ])).to.be(false));
      });
    });

    describe('getType()', function () {
      it ('returns the correct license type', function () {
        return xpackInfoTest({ license: { type: 'basic' } })
        .then(info => expect(info.license.getType()).to.be('basic'));
      });
    });
  });

  describe('feature', function () {
    describe('isAvailable()', function () {
      it ('returns true if the given feature is available', function () {
        return xpackInfoTest({ features: { graph: { available: true } } })
        .then(info => expect(info.feature('graph').isAvailable()).to.be(true));
      });
      it ('returns false if the given feature is not available', function () {
        return xpackInfoTest({ features: { graph: { available: false } } })
        .then(info => expect(info.feature('graph').isAvailable()).to.be(false));
      });
    });

    describe('isEnabled()', function () {
      it ('returns true if the given feature is enabled', function () {
        return xpackInfoTest({ features: { graph: { enabled: true } } })
        .then(info => expect(info.feature('graph').isEnabled()).to.be(true));
      });
      it ('returns false if the given feature is not enabled', function () {
        return xpackInfoTest({ features: { graph: { enabled: false } } })
        .then(info => expect(info.feature('graph').isEnabled()).to.be(false));
      });
    });

    describe('registerLicenseCheckResultsGenerator()', () => {
      it ('registers a generator and calls it to populate response for UI', () => {
        const reportingUIVars = {
          foo: 17,
          bar: {
            baz: 17
          }
        };
        const reportingLicenseCheckResultsGenerator = () => reportingUIVars;

        return xpackInfoTest()
        .then(info => {
          info.feature('reporting').registerLicenseCheckResultsGenerator(reportingLicenseCheckResultsGenerator);
          expect(info.toJSON().features).to.eql({reporting: reportingUIVars});
        });
      });
    });
  });

  describe('getLicenseCheckResults()', () => {
    it ('returns the license check results for the specified feature', () => {
      const mockReportingLicenseCheckResults = {
        enabled: false,
        message: 'Reporting is not enabled in Basic license'
      };
      const reportingLicenseCheckResultsGenerator = () => mockReportingLicenseCheckResults;

      return xpackInfoTest()
      .then(info => {
        info.feature('reporting').registerLicenseCheckResultsGenerator(reportingLicenseCheckResultsGenerator);
        expect(info.feature('reporting').getLicenseCheckResults()).to.be(mockReportingLicenseCheckResults);
      });
    });
  });

  describe('getSignature()', function () {
    it ('returns the correct signature', function () {
      return xpackInfoTest({ license: { status: 'active', type: 'basic', expiry_date_in_millis: 1464315131123 }})
      .then(info => {
        const expectedSignature = createHash('md5')
        .update(JSON.stringify(info.toJSON()))
        .digest('hex');
        expect(info.getSignature()).to.be(expectedSignature);
      });
    });
  });

  describe('an updated response from the _xpack API', function () {
    it ('causes the info object and signature to be updated', function () {
      let previousSignature;
      setClientResponse({ license: { status: 'active' }});
      return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
      .then(info => {
        expect(info.license.isActive()).to.be(true);
        previousSignature = info.getSignature();

        setClientResponse({ license: { status: 'expired' }});
        return Bluebird.delay(pollFrequencyInMillis * 2, info);
      })
      .then((info) => {
        info.stopPolling();
        expect(info.license.isActive()).to.be(false);
        expect(info.getSignature()).to.not.be(previousSignature);
      });
    });
  });

  describe('refreshNow()', () => {
    it ('calls the Elasticsearch GET _xpack API immediately', () => {
      let previousSignature;
      return xpackInfoTest({ license: { status: 'active' }})
      .then(info => {
        previousSignature = info.getSignature();
        setClientResponse({ license: { status: 'expired' }});
        return info.refreshNow();
      })
      .then(newInfo => {
        expect(newInfo.getSignature()).to.not.be(previousSignature);
      });
    });
  });
});
