import { createHash } from 'crypto';
const expect = require('expect.js');
const Bluebird = require('bluebird');
import moment from 'moment';
const xpackInfo = require('../xpack_info');

describe('xpack_info', function () {

  let mockClient;
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
  });

  describe('license', function () {
    describe('isActive()', function () {
      it ('returns true if the license is active', function () {
        setClientResponse({ license: { status: 'active' }});
        xpackInfo(mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.isActive()).to.be(true);
        });
      });
      it ('returns false if the license has expired', function () {
        setClientResponse({ license: { status: 'expired' }});
        xpackInfo(mockClient, pollFrequencyInMillis)
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
        xpackInfo(mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.expiresSoon()).to.be(true);
        });
      });
      it ('returns false if the license will expire after 30 days', function () {
        const licenseExpirationDate = moment.utc().add('40', 'days');
        setClientResponse({ license: { expiry_date_in_millis: licenseExpirationDate.valueOf() }});
        xpackInfo(mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.expiresSoon()).to.be(false);
        });
      });
    });

    describe('isOneOf()', function () {
      it ('returns true if the license is the single given mode', function () {
        setClientResponse({ license: { mode: 'gold' }});
        xpackInfo(mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.isOneOf('gold')).to.be(true);
        });
      });
      it ('returns true if the license is one of multiple given modes', function () {
        setClientResponse({ license: { mode: 'gold' }});
        xpackInfo(mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.isOneOf([ 'trial', 'gold' ])).to.be(true);
        });
      });
      it ('returns false if the license is not one of the multiple given modes', function () {
        setClientResponse({ license: { mode: 'basic' }});
        xpackInfo(mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.license.isOneOf([ 'trial', 'gold' ])).to.be(false);
        });
      });
    });

    describe('getSignature()', function () {
      it ('returns the correct signature', function () {
        setClientResponse({ license: { status: 'active', mode: 'basic', expiry_date_in_millis: 1464315131123 }});
        const expectedSignature = createHash('md5')
        .update('active|1464315131123|basic')
        .digest('hex');

        xpackInfo(mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.getSignature()).to.be(expectedSignature);
        });
      });
    });
  });

  describe('feature', function () {
    describe('isAvailable()', function () {
      it ('returns true if the given feature is available', function () {
        setClientResponse({ features: { graph: { available: true } } });
        xpackInfo(mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.feature('graph').isAvailable()).to.be(true);
        });
      });
      it ('returns false if the given feature is not available', function () {
        setClientResponse({ features: { graph: { available: false } } });
        xpackInfo(mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.feature('graph').isAvailable()).to.be(false);
        });
      });
    });

    describe('isEnabled()', function () {
      it ('returns true if the given feature is enabled', function () {
        setClientResponse({ features: { graph: { enabled: true } } });
        xpackInfo(mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.feature('graph').isEnabled()).to.be(true);
        });
      });
      it ('returns false if the given feature is not enabled', function () {
        setClientResponse({ features: { graph: { enabled: false } } });
        xpackInfo(mockClient, pollFrequencyInMillis)
        .then(info => {
          info.stopPolling();
          expect(info.feature('graph').isEnabled()).to.be(false);
        });
      });
    });
  });

  describe('an updated response from the _xpack API', function () {
    it ('causes the info object and signature to be updated', function (done) {
      let previousSignature;
      setClientResponse({ license: { status: 'active' }});
      xpackInfo(mockClient, pollFrequencyInMillis)
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
      })
      .then(done);
    });
  });
});
