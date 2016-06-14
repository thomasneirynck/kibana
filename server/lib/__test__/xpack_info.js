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
        setClientResponse({ license: { status: 'active' }});
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.isActive()).to.be(true);
        });
      });
      it ('returns false if the license has expired', function () {
        setClientResponse({ license: { status: 'expired' }});
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.isActive()).to.be(false);
        });
      });
    });

    describe('expiresSoon()', function () {
      it ('returns true if the license will expire within 30 days', function () {
        const licenseExpirationDate = moment.utc().add('20', 'days');
        setClientResponse({ license: { expiry_date_in_millis: licenseExpirationDate.valueOf() }});
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.expiresSoon()).to.be(true);
        });
      });
      it ('returns false if the license will expire after 30 days', function () {
        const licenseExpirationDate = moment.utc().add('40', 'days');
        setClientResponse({ license: { expiry_date_in_millis: licenseExpirationDate.valueOf() }});
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.expiresSoon()).to.be(false);
        });
      });
    });

    describe('getExpiryDateInMillis()', function () {
      it ('returns the expiration date in milliseconds', function () {
        const licenseExpirationDateInMillis = 1465527717231; // 2016-06-10T03:01:57.231Z
        setClientResponse({ license: { expiry_date_in_millis: licenseExpirationDateInMillis }});
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.getExpiryDateInMillis()).to.be(licenseExpirationDateInMillis);
        });
      });
    });

    describe('isOneOf()', function () {
      it ('returns true if the license is the single given mode', function () {
        setClientResponse({ license: { mode: 'gold' }});
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.isOneOf('gold')).to.be(true);
        });
      });
      it ('returns true if the license is one of multiple given modes', function () {
        setClientResponse({ license: { mode: 'gold' }});
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.isOneOf([ 'trial', 'gold' ])).to.be(true);
        });
      });
      it ('returns false if the license is not one of the multiple given modes', function () {
        setClientResponse({ license: { mode: 'basic' }});
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.isOneOf([ 'trial', 'gold' ])).to.be(false);
        });
      });
    });

    describe('getType()', function () {
      it ('returns the correct license type', function () {
        setClientResponse({ license: { type: 'basic' } });
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.getType()).to.be('basic');
        });
      });
    });
  });

  describe('feature', function () {
    describe('isAvailable()', function () {
      it ('returns true if the given feature is available', function () {
        setClientResponse({ features: { graph: { available: true } } });
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.feature('graph').isAvailable()).to.be(true);
        });
      });
      it ('returns false if the given feature is not available', function () {
        setClientResponse({ features: { graph: { available: false } } });
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.feature('graph').isAvailable()).to.be(false);
        });
      });
    });

    describe('isEnabled()', function () {
      it ('returns true if the given feature is enabled', function () {
        setClientResponse({ features: { graph: { enabled: true } } });
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.feature('graph').isEnabled()).to.be(true);
        });
      });
      it ('returns false if the given feature is not enabled', function () {
        setClientResponse({ features: { graph: { enabled: false } } });
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.feature('graph').isEnabled()).to.be(false);
        });
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
        return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          info.feature('reporting').registerLicenseCheckResultsGenerator(reportingLicenseCheckResultsGenerator);
          expect(info.toJSON().features).to.eql({reporting: reportingUIVars});
        });
      });
    });
  });

  describe('getSignature()', function () {
    it ('returns the correct signature', function () {
      setClientResponse({ license: { status: 'active', mode: 'basic', expiry_date_in_millis: 1464315131123 }});
      const expectedSignature = createHash('md5')
      .update('active|1464315131123|basic')
      .digest('hex');

      return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
      .then(info => {
        info.stopPolling();
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
      setClientResponse({ license: { status: 'active' }});
      return xpackInfo(mockServer, mockClient, pollFrequencyInMillis)
      .then(info => {
        info.stopPolling();
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
