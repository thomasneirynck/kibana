import _ from 'lodash';
import { getTimeseriesData } from '../get_timeseries_data';
import elasticSearchResponse from './response.json';

describe('get_timeseries_data', () => {
  let res;
  beforeEach(async () => {
    res = await getTimeseriesData({
      serviceName: 'myServiceName',
      transactionType: 'myTransactionType',
      transactionName: 'myTransactionName',
      setup: {
        start: 1510673413814,
        end: 1510674313814,
        client: jest.fn(() => Promise.resolve(elasticSearchResponse)),
        config: {
          get: () => 'myIndex'
        }
      }
    });
  });

  it('should not contain first and last bucket', () => {
    const datesBefore = elasticSearchResponse.aggregations.transaction_results.buckets[0].timeseries.buckets.map(
      bucket => bucket.key
    );

    const [firstBucket, lastBucket] = _.difference(datesBefore, res.dates);

    expect(firstBucket).toEqual(_.first(datesBefore));
    expect(lastBucket).toEqual(_.last(datesBefore));
  });

  it('should have correct order', () => {
    expect(res.tpm_buckets.map(bucket => bucket.key)).toEqual([
      'HTTP 2xx',
      'HTTP 4xx',
      'HTTP 5xx',
      '3CustomStuff'
    ]);
  });

  it('should match snapshot', () => {
    expect(res).toMatchSnapshot();
  });
});
