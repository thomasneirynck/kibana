import { getBuckets } from './get_buckets';

function getBucketSize({ start, end, config }) {
  const bucketTargetCount = config.get('xpack.apm.bucketTargetCount');
  return Math.floor((end - start) / bucketTargetCount);
}

export async function getDistribution(req) {
  const { groupId } = req.params;
  const bucketSize = getBucketSize(req.pre.setup);
  const buckets = await getBuckets(req, groupId, bucketSize);

  return {
    buckets,
    bucket_size: bucketSize
  };
}
