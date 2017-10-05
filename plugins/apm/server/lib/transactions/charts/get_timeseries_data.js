import {
  TRANSACTION_DURATION,
  TRANSACTION_RESULT,
  APP_NAME,
  TRANSACTION_TYPE,
  TRANSACTION_NAME
} from '../../../../common/constants';
import moment from 'moment';
import { isNumber, get } from 'lodash';
import { getBucketSize } from '../../helpers/get_bucket_size';

export async function getTimeseriesData({
  appName,
  transactionType,
  transactionName,
  setup
}) {
  const { start, end, client, config } = setup;
  const { intervalString } = getBucketSize(start, end, '1m');

  const params = {
    index: config.get('xpack.apm.indexPattern'),
    body: {
      size: 0,
      query: {
        bool: {
          must: [
            { term: { [APP_NAME]: appName } },
            { term: { [TRANSACTION_TYPE]: transactionType } },
            {
              range: {
                '@timestamp': {
                  gte: start,
                  lte: end,
                  format: 'epoch_millis'
                }
              }
            }
          ]
        }
      },
      aggs: {
        response_times: {
          date_histogram: {
            field: '@timestamp',
            interval: intervalString,
            min_doc_count: 0,
            extended_bounds: {
              min: start,
              max: end
            }
          },
          aggs: {
            avg: {
              avg: { field: TRANSACTION_DURATION }
            },
            pct: {
              percentiles: {
                field: TRANSACTION_DURATION,
                percents: [95, 99]
              }
            }
          }
        },
        overall_avg: {
          avg: { field: TRANSACTION_DURATION }
        },
        rpm_per_status_class: {
          filters: {
            filters: {
              '2xx': {
                range: { [TRANSACTION_RESULT]: { gte: 200, lte: 299 } }
              },
              '3xx': {
                range: { [TRANSACTION_RESULT]: { gte: 300, lte: 399 } }
              },
              '4xx': {
                range: { [TRANSACTION_RESULT]: { gte: 400, lte: 499 } }
              },
              '5xx': { range: { [TRANSACTION_RESULT]: { gte: 500, lte: 599 } } }
            }
          },
          aggs: {
            overall_avg: {
              stats_bucket: {
                buckets_path: 'timeseries>rpm[normalized_value]'
              }
            },
            timeseries: {
              date_histogram: {
                field: '@timestamp',
                interval: intervalString,
                min_doc_count: 0,
                extended_bounds: {
                  min: start.valueOf(),
                  max: end.valueOf()
                }
              },
              aggs: {
                cumsum: {
                  cumulative_sum: {
                    buckets_path: '_count'
                  }
                },
                rpm: {
                  derivative: {
                    buckets_path: 'cumsum',
                    unit: '1m'
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  if (transactionName) {
    params.body.query.bool.must.push({
      term: { [`${TRANSACTION_NAME}.keyword`]: transactionName }
    });
  }

  const resp = await client('search', params);
  const responseTimeBuckets = get(resp, 'aggregations.response_times.buckets');
  const statusBuckets = get(resp, 'aggregations.rpm_per_status_class.buckets');
  const overallAvg = get(resp, 'aggregations.overall_avg.value');

  function getDataFor(key) {
    return get(statusBuckets, `${key}.timeseries.buckets`).map(bucket => {
      return get(bucket, 'rpm.normalized_value', 0) || 0;
    });
  }

  return {
    total_hits: resp.hits.total,
    response_times: responseTimeBuckets.reduce(
      (acc, bucket) => {
        const p95 = bucket.pct.values['95.0'];
        const p99 = bucket.pct.values['99.0'];
        acc.dates.push(moment.utc(bucket.key).toISOString());
        acc.avg.push(bucket.avg.value || 0);
        acc.p95.push((isNumber(p95) && p95) || 0);
        acc.p99.push((isNumber(p99) && p99) || 0);
        return acc;
      },
      { avg: [], p95: [], p99: [], dates: [] }
    ),
    rpm_per_status_class: {
      dates: get(statusBuckets, '2xx.timeseries.buckets').map(bucket => {
        return moment.utc(bucket.key).toISOString();
      }),
      '2xx': getDataFor('2xx'),
      '3xx': getDataFor('3xx'),
      '4xx': getDataFor('4xx'),
      '5xx': getDataFor('5xx')
    },
    rpm_per_status_class_average: {
      '2xx': get(statusBuckets, '2xx.overall_avg.avg', 0) || 0,
      '3xx': get(statusBuckets, '3xx.overall_avg.avg', 0) || 0,
      '4xx': get(statusBuckets, '4xx.overall_avg.avg', 0) || 0,
      '5xx': get(statusBuckets, '5xx.overall_avg.avg', 0) || 0
    },
    weighted_average: overallAvg || 0
  };
}
