import { getBuckets } from './get_buckets';
import { calculateBucketSize } from './calculate_bucket_size';

function getDefaultBucketIndex(buckets) {
  const filledBuckets = buckets.filter(bucket => bucket.count);
  const middleBucket = filledBuckets[Math.floor(filledBuckets.length / 2)];
  return buckets.indexOf(middleBucket);
}

export async function getDistribution({ appName, transactionName, setup }) {
  const bucketSize = await calculateBucketSize({
    appName,
    transactionName,
    setup
  });
  const { buckets, total_hits } = await getBuckets({
    appName,
    transactionName,
    setup,
    bucketSize
  });

  return {
    total_hits,
    buckets,
    bucket_size: bucketSize,
    default_bucket_index: getDefaultBucketIndex(buckets)
  };
}
