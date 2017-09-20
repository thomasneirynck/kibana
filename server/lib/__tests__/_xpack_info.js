import { createHash } from 'crypto';
const expect = require('expect.js');
import moment from 'moment';
const { _xpackInfo } = require('../_xpack_info');
import sinon from 'sinon';

describe('xpack_info', function () {
  let mockServer;
  let mockCluster;

  const pollFrequencyInMillis = 10;
  const sandbox = sinon.sandbox.create();

  function stubResponse(response = {}) {
    mockCluster.callWithInternalUser.resetBehavior();
    mockCluster.callWithInternalUser.returns(Promise.resolve(response));
  }

  async function xpackInfoTest(response = {}) {
    stubResponse(response);

    const info = await _xpackInfo(mockServer, pollFrequencyInMillis);
    await info.refreshNow();
    info.stopPolling();

    return info;
  }

  beforeEach(function () {
    sandbox.useFakeTimers();

    mockCluster = { callWithInternalUser: sinon.stub() };

    mockServer = {
      log: sinon.stub(),
      plugins: {
        elasticsearch: { getCluster: sinon.stub() }
      }
    };

    mockServer.plugins.elasticsearch.getCluster.withArgs('data').returns(mockCluster);
  });

  afterEach(() => {
    sandbox.restore();

    mockServer = null;
    mockCluster = null;
  });

  describe('license', function () {
    describe('isActive()', function () {
      it('returns true if the license is active', async () => {
        const info = await xpackInfoTest({ license: { status: 'active' } });
        expect(info.license.isActive()).to.be(true);
      });

      it('returns false if the license has expired', async () => {
        const info = await xpackInfoTest({ license: { status: 'expired' } });
        expect(info.license.isActive()).to.be(false);
      });
    });

    describe('logging for imported license', function () {
      it('logs clusterSource and status:active if the license is active', async () => {
        const info = await xpackInfoTest({ license: { status: 'active' } });
        expect(info.license.isActive()).to.be(true);
        expect(mockServer.log.getCall(0).args).to.eql([
          ['license', 'debug', 'xpack'],
          'Calling Elasticsearch _xpack API'
        ]);
        expect(mockServer.log.getCall(1).args).to.eql([ ['license', 'info', 'xpack'], (
          'Imported license information from Elasticsearch for the [data] cluster: mode: undefined ' +
          '| status: active ' +
          '| expiry date: Invalid date'
        ) ]);
      });

      it('logs clusterSource and status:expired if the license has expired', async () => {
        const info = await xpackInfoTest({ license: { status: 'expired' } });
        expect(info.license.isActive()).to.be(false);
        expect(mockServer.log.getCall(0).args).to.eql([
          ['license', 'debug', 'xpack'],
          'Calling Elasticsearch _xpack API'
        ]);
        expect(mockServer.log.getCall(1).args).to.eql([ ['license', 'info', 'xpack'], (
          'Imported license information from Elasticsearch for the [data] cluster: mode: undefined ' +
          '| status: expired ' +
          '| expiry date: Invalid date'
        ) ]);
      });
    });

    describe('expiresSoon()', function () {
      it ('returns true if the license will expire within 30 days', async () => {
        const licenseExpirationDate = moment.utc().add('20', 'days');
        const info = await xpackInfoTest({ license: { expiry_date_in_millis: licenseExpirationDate.valueOf() } });

        expect(info.license.expiresSoon()).to.be(true);
      });

      it ('returns false if the license will expire after 30 days', async () => {
        const licenseExpirationDate = moment.utc().add('40', 'days');
        const info = await xpackInfoTest({ license: { expiry_date_in_millis: licenseExpirationDate.valueOf() } });


        expect(info.license.expiresSoon()).to.be(false);
      });
    });

    describe('getExpiryDateInMillis()', function () {
      it ('returns the expiration date in milliseconds', async () => {
        const licenseExpirationDateInMillis = 1465527717231; // 2016-06-10T03:01:57.231Z
        const info = await xpackInfoTest({ license: { expiry_date_in_millis: licenseExpirationDateInMillis } });

        expect(info.license.getExpiryDateInMillis()).to.be(licenseExpirationDateInMillis);
      });
    });

    describe('isOneOf()', function () {
      it ('returns true if the license is the single given mode', async () => {
        const info = await xpackInfoTest({ license: { mode: 'gold' } });
        expect(info.license.isOneOf('gold')).to.be(true);
      });

      it ('returns true if the license is one of multiple given modes', async () => {
        const info = await xpackInfoTest({ license: { mode: 'gold' } });
        expect(info.license.isOneOf([ 'trial', 'gold' ])).to.be(true);
      });

      it ('returns false if the license is not one of the multiple given modes', async () => {
        const info = await xpackInfoTest({ license: { mode: 'basic' } });
        expect(info.license.isOneOf([ 'trial', 'gold' ])).to.be(false);
      });
    });

    describe('getType()', function () {
      it ('returns the correct license type', async () => {
        const info = await  xpackInfoTest({ license: { type: 'basic' } });
        expect(info.license.getType()).to.be('basic');
      });
    });
  });

  describe('feature', function () {
    describe('isAvailable()', function () {
      it ('returns true if the given feature is available', async () => {
        const info = await xpackInfoTest({ features: { graph: { available: true } } });
        expect(info.feature('graph').isAvailable()).to.be(true);
      });

      it ('returns false if the given feature is not available', async () => {
        const info = await xpackInfoTest({ features: { graph: { available: false } } });
        expect(info.feature('graph').isAvailable()).to.be(false);
      });
    });

    describe('isEnabled()', function () {
      it ('returns true if the given feature is enabled', async () => {
        const info = await xpackInfoTest({ features: { graph: { enabled: true } } });
        expect(info.feature('graph').isEnabled()).to.be(true);
      });

      it ('returns false if the given feature is not enabled', async () => {
        const info = await xpackInfoTest({ features: { graph: { enabled: false } } });
        expect(info.feature('graph').isEnabled()).to.be(false);
      });
    });

    describe('registerLicenseCheckResultsGenerator()', () => {
      it ('registers a generator and calls it to populate response for UI', async () => {
        const reportingUIVars = {
          foo: 17,
          bar: {
            baz: 17
          }
        };
        const reportingLicenseCheckResultsGenerator = () => reportingUIVars;

        const info = await xpackInfoTest();
        info.feature('reporting').registerLicenseCheckResultsGenerator(reportingLicenseCheckResultsGenerator);
        expect(info.toJSON().features).to.eql({ reporting: reportingUIVars });
      });
    });
  });

  describe('getLicenseCheckResults()', () => {
    it ('returns the license check results for the specified feature', async () => {
      const mockReportingLicenseCheckResults = {
        enabled: false,
        message: 'Reporting is not enabled in Basic license'
      };
      const reportingLicenseCheckResultsGenerator = () => mockReportingLicenseCheckResults;

      const info = await xpackInfoTest();
      info.feature('reporting').registerLicenseCheckResultsGenerator(reportingLicenseCheckResultsGenerator);
      expect(info.feature('reporting').getLicenseCheckResults()).to.be(mockReportingLicenseCheckResults);
    });
  });

  describe('getSignature()', function () {
    it ('returns the correct signature', async () => {
      const info = await xpackInfoTest({
        license: {
          status: 'active',
          type: 'basic',
          expiry_date_in_millis: 1464315131123
        }
      });
      const expectedSignature = createHash('md5')
        .update(JSON.stringify(info.toJSON()))
        .digest('hex');

      expect(info.getSignature()).to.be(expectedSignature);
    });
  });

  describe('an updated response from the _xpack API', function () {
    it('causes the info object and signature to be updated', async () => {
      stubResponse({ license: { status: 'active' } });
      const info = await _xpackInfo(mockServer, pollFrequencyInMillis);
      await info.refreshNow();

      expect(info.license.isActive()).to.be(true);

      const previousSignature = info.getSignature();
      stubResponse({ license: { status: 'expired' } });
      sandbox.clock.tick(pollFrequencyInMillis * 2);
      info.stopPolling();

      // Exhaust micro-task queue, to make sure mockCluster has been queried.
      await Promise.resolve();

      expect(info.license.isActive()).to.be(false);
      expect(info.getSignature()).to.not.be(previousSignature);
    });
  });

  describe('refreshNow()', () => {
    it('calls the Elasticsearch GET _xpack API immediately', async () => {
      const info = await xpackInfoTest({ license: { status: 'active' } });
      const previousSignature = info.getSignature();

      stubResponse({ license: { status: 'expired' } });
      await info.refreshNow();

      expect(info.getSignature()).to.not.be(previousSignature);
    });
  });
});
