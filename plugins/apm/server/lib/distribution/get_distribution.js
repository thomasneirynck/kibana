import { getBuckets } from './get_buckets';
import { calculateBucketSize } from './calculate_bucket_size';

function getDefaultBucketIndex(buckets) {
  const filledBuckets = buckets.filter(bucket => bucket.count);
  const middleBucket = filledBuckets[Math.floor(filledBuckets.length / 2)];
  return buckets.indexOf(middleBucket);
}

export async function getDistribution(req) {
  const { transaction_name: transactionName } = req.query;
  const bucketSize = await calculateBucketSize(req, transactionName);
  const buckets = await getBuckets(req, transactionName, bucketSize);

  return {
    buckets,
    bucket_size: bucketSize,
    default_bucket_index: getDefaultBucketIndex(buckets)
  };
}
