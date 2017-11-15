import { getTimeseriesData } from '../get_timeseries_data';
import response from './response.json';

describe('get_timeseries_data', () => {
  let res;
  beforeEach(async () => {
    res = await getTimeseriesData({
      appName: 'myAppName',
      transactionType: 'myTransactionType',
      transactionName: 'myTransactionName',
      setup: {
        start: 1510673413814,
        end: 1510674313814,
        client: jest.fn(() => Promise.resolve(response)),
        config: {
          get: () => 'myIndex'
        }
      }
    });
  });

  it('should match snapshot', () => {
    expect(res).toMatchSnapshot();
  });

  it('should have correct order', () => {
    expect(res.tpm_buckets.map(bucket => bucket.key)).toEqual([
      'HTTP 2xx',
      'HTTP 4xx',
      'HTTP 5xx',
      '3CustomStuff'
    ]);
  });
});
