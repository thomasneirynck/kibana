import { getBucketSize } from './get_bucket_size';
import { getStartEnd } from './get_start_end';
export function setupRequest(req, reply) {
  const { server } = req;
  const config = server.config();
  const { callWithRequest } = server.plugins.elasticsearch.getCluster('data');

  const { start, end } = getStartEnd(req.query.start, req.query.end);
  const { bucketSize, intervalString } = getBucketSize(start, end, '1m');

  reply({
    start,
    end,
    client: callWithRequest.bind(null, req),
    intervalString,
    bucketSize,
    config
  });
}
