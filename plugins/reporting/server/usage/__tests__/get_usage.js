import expect from 'expect.js';
import sinon from 'sinon';
import { getReportingUsage } from '../get_usage';

describe('getReportingUsage', () => {
  let callClusterStub;
  let serverStub;
  let licenseStub;

  beforeEach(() => {
    callClusterStub = sinon.stub().returns(Promise.resolve({
      hits: {
        total: 0
      },
      aggregations: {
        types: {
          buckets: [
            { key: 'csv', doc_count: 0 },
            { key: 'printable_pdf', doc_count: 0 }
          ]
        }
      }
    }));
    licenseStub = sinon.stub().returns('basic');
    serverStub = {
      plugins: {
        elasticsearch: { getCluster: sinon.stub() },
        xpack_main: {
          info: {
            license: { getType: licenseStub },
            isAvailable() { return true; }
          }
        }
      },
      config: () => ({
        get: sinon.stub().withArgs('xpack.reporting.enabled').returns(true)
      }),
      expose: sinon.stub(),
      log: sinon.stub(),
    };
  });

  describe('format search result data', () => {
    it('formats search result data into an expected structure', async () => {
      callClusterStub = sinon.stub().returns(Promise.resolve({
        hits: {
          total: 55
        },
        aggregations: {
          types: {
            buckets: [
              { key: 'csv', doc_count: 22 },
              { key: 'printable_pdf', doc_count: 33 }
            ]
          }
        }
      }));

      const results = await getReportingUsage(callClusterStub, serverStub);

      expect(results).to.eql({
        _all: 55,
        available: true,
        enabled: true,
        csv: {
          available: true,
          count: 22,
        },
        printable_pdf: {
          available: false,
          count: 33,
        },
      });
    });

    it('includes unknown job types present in the search result', async () => {
      callClusterStub = sinon.stub().returns(Promise.resolve({
        hits: {
          total: 55
        },
        aggregations: {
          types: {
            buckets: [
              { key: 'testJob1', doc_count: 22 },
              { key: 'testJob2', doc_count: 33 }
            ]
          }
        }
      }));

      const results = await getReportingUsage(callClusterStub, serverStub);

      expect(results).to.eql({
        _all: 55,
        available: true,
        enabled: true,
        csv: {
          available: true,
          count: 0,
        },
        printable_pdf: {
          available: false,
          count: 0,
        },
        testJob1: {
          available: false,
          count: 22,
        },
        testJob2: {
          available: false,
          count: 33,
        },
      });
    });
  });

  describe('license determines export types available', () => {
    it('platinum license determines csv and printable_pdf export types available', async () => {
      serverStub.plugins.xpack_main.info.license.getType = sinon.stub().returns('platinum');
      callClusterStub = sinon.stub().returns(Promise.resolve({
        hits: {
          total: 55
        },
        aggregations: {
          types: {
            buckets: [
              { key: 'csv', doc_count: 22 },
              { key: 'printable_pdf', doc_count: 33 }
            ]
          }
        }
      }));

      const results = await getReportingUsage(callClusterStub, serverStub);

      expect(results).to.eql({
        _all: 55,
        available: true,
        enabled: true,
        csv: {
          available: true,
          count: 22,
        },
        printable_pdf: {
          available: true,
          count: 33,
        },
      });
    });

    it('basic license determines csv export type available', async () => {
      // NOTE: license type is basic by default due to test suite setup
      const results = await getReportingUsage(callClusterStub, serverStub);

      expect(results).to.eql({
        _all: 0,
        available: true,
        enabled: true,
        csv: {
          available: true,
          count: 0,
        },
        printable_pdf: {
          available: false,
          count: 0,
        },
      });
    });
  });

  describe('X-Pack license availability determins Reporting availability', () => {
    it('if X-Pack info is not available, Reporting usage shows not available and not enabled', async () => {
      serverStub.plugins.xpack_main.info.license.getType = sinon.stub().returns('platinum');
      serverStub.plugins.xpack_main.info.isAvailable = () => false;

      const results = await getReportingUsage(callClusterStub, serverStub);

      expect(results).to.eql({
        _all: 0,
        available: false,
        enabled: false,
        csv: {
          available: false,
          count: 0,
        },
        printable_pdf: {
          available: false,
          count: 0,
        },
      });
    });
  });

  describe('when reporting plugin is disabled', () => {
    it('response will not include job type counts', async () => {
      const configGetStub = sinon.stub();
      configGetStub.withArgs('xpack.reporting.enabled').returns(false);
      configGetStub.withArgs('xpack.reporting.index').throws('invalid config key');
      serverStub.config = () => ({ get: configGetStub });
      const results = await getReportingUsage(callClusterStub, serverStub);

      expect(results).to.eql({
        _all: undefined,
        available: true,
        enabled: false,
        csv: {
          available: true,
          count: undefined,
        },
        printable_pdf: {
          available: false,
          count: undefined,
        },
      });
    });
  });
});
