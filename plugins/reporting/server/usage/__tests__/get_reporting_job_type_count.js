import expect from 'expect.js';
import sinon from 'sinon';
import { getReportingJobTypeCount } from '../get_reporting_job_type_count';

describe('getReportingJobTypeCount', () => {
  let callClusterStub;
  let configStub;

  beforeEach(() => {
    callClusterStub = sinon.stub().returns(Promise.resolve({
      hits: {
        total: 0
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
    configStub = { get: sinon.stub().returns('foo_index_123') };
  });

  it('sends a query to the cluster', async () => {
    const numExportTypes = 9999;
    const results = await getReportingJobTypeCount(callClusterStub, configStub, numExportTypes);
    expect(results).to.eql({
      total: 0,
      counts: {
        csv: 22,
        printable_pdf: 33
      }
    });
    expect(callClusterStub.calledOnce).to.be(true);
    const { args } = callClusterStub.getCall(0);
    expect(args[1]).to.eql({
      index: 'foo_index_123-*',
      filterPath: ['hits.total', 'aggregations.types.buckets'],
      body: {
        size: 0,
        aggs: { types: { terms: { field: 'jobtype', size: 9999 } } }
      }
    });
  });

  it('prevents querying the cluster if reporting plugin is disabled', async () => {
    configStub.get = sinon.stub().throws('invalid config key');
    const results = await getReportingJobTypeCount(callClusterStub, configStub);
    expect(results).to.eql({
      total: null,
      counts: {}
    });
    expect(callClusterStub.called).to.be(false);
  });
});
