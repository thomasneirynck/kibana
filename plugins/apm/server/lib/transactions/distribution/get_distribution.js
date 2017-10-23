import { get } from 'lodash';
import { getBuckets } from './get_buckets';
import { calculateBucketSize } from './calculate_bucket_size';

function getDefaultTransactionId(buckets) {
  const filledBuckets = buckets.filter(bucket => bucket.count);
  const middleIndex = Math.floor(filledBuckets.length / 2);
  return get(filledBuckets, `[${middleIndex}].transaction_id`);
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
    default_transaction_id: getDefaultTransactionId(buckets)
  };
}
