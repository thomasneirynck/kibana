import { capitalize, get } from 'lodash';

export const beatsAggFilterPath = [
  'aggregations.total',
  'aggregations.types.buckets.key',
  'aggregations.types.buckets.uuids.buckets.doc_count',
  'aggregations.events_published_sum_upper_bound',
  'aggregations.bytes_sent_sum_upper_bound',
];

export const beatsUuidsAgg = maxBucketSize => ({
  types: {
    terms: {
      field: 'beats_stats.beat.type',
      size: 1000 // 1000 different types of beats possible seems like enough
    },
    aggs: {
      uuids: {
        terms: {
          field: 'beats_stats.beat.uuid',
          size: maxBucketSize,
        }
      }
    }
  },
  total: {
    cardinality: {
      field: 'beats_stats.beat.uuid',
      precision_threshold: 10000
    }
  },
  beat_uuids: {
    terms: {
      field: 'beats_stats.beat.uuid',
      size: maxBucketSize
    },
    aggs: {
      upper_bound_stats: {
        terms: {
          field: 'beats_stats.timestamp',
          size: 1,
          order: {
            _key: 'desc'
          }
        },
        aggs: {
          events_published: {
            max: {
              field: 'beats_stats.metrics.libbeat.pipeline.events.published'
            }
          },
          bytes_sent: {
            max: {
              field: 'beats_stats.metrics.libbeat.output.write.bytes'
            }
          }
        }
      },
      events_published_upper_bound: {
        sum_bucket: {
          buckets_path: 'upper_bound_stats>events_published'
        }
      },
      bytes_sent_upper_bound: {
        sum_bucket: {
          buckets_path: 'upper_bound_stats>bytes_sent'
        }
      },
    }
  },
  events_published_sum_upper_bound: {
    sum_bucket: {
      buckets_path: 'beat_uuids>events_published_upper_bound'
    }
  },
  bytes_sent_sum_upper_bound: {
    sum_bucket: {
      buckets_path: 'beat_uuids>bytes_sent_upper_bound'
    }
  },
});

export const beatsAggResponseHandler = response => {
  // beat types stat
  const buckets = get(response, 'aggregations.types.buckets', []);
  const beatTotal = get(response, 'aggregations.total.value');
  const beatTypes = buckets.reduce((types, typeBucket) => {
    return [
      ...types,
      {
        type: capitalize(typeBucket.key),
        count: get(typeBucket, 'uuids.buckets.length'),
      }
    ];
  }, []);

  return {
    beatTotal,
    beatTypes,
    publishedEvents: get(response, 'aggregations.events_published_sum_upper_bound.value'),
    bytesSent: get(response, 'aggregations.bytes_sent_sum_upper_bound.value'),
  };
};
