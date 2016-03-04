const _ = require('lodash');

module.exports = (req) => {
  const server = req.server;
  const callWithRequest = server.plugins.elasticsearch.callWithRequest;
  const config = server.config();
  return (clusters) => {
    const bodies = [];
    clusters.forEach((cluster) => {
      bodies.push({ index: config.get('monitoring.index_prefix') + '*', type: 'shards' });
      bodies.push({
        size: 0,
        query: { bool: { filter: {
          term: { 'state_uuid': cluster.state_uuid }
        } } },
        aggs: {
          indices: {
            meta: { state_uuid: cluster.state_uuid, cluster_uuid: cluster.cluster_uuid },
            terms: {
              field: 'shard.index',
              size: config.get('monitoring.max_bucket_size')
            },
            aggs: {
              states: {
                terms: {
                  field: 'shard.state',
                  size: 10
                },
                aggs: {
                  primary: {
                    terms: {
                      field: 'shard.primary',
                      size: 10
                    }
                  }
                }
              }
            }
          },
          nodes: {
            meta: { state_uuid: cluster.state_uuid, cluster_uuid: cluster.cluster_uuid },
            terms: {
              field: 'shard.node',
              size: config.get('monitoring.max_bucket_size')
            },
            aggs: {
              index_count: {
                cardinality: {
                  field: 'shard.index'
                }
              }
            }
          }
        }
      });
    });
    if (!bodies.length) return Promise.resolve();
    const params = {
      meta: 'get_shard_stats_for_clusters',
      body: bodies
    };
    return callWithRequest(req, 'msearch', params)
    .then((res) => {
      res.responses.forEach((resp) => {
        const data = { totals: { primary: 0, replica: 0, unassigned: { replica: 0, primary: 0 } } };

        function createNewMetric() {
          return {
            status: 'green',
            primary: 0,
            replica: 0,
            unassigned: {
              replica: 0,
              primary: 0
            }
          };
        };

        function setStats(bucket, metric, ident) {
          const states = _.filter(bucket.states.buckets, ident);
          states.forEach((currentState) => {
            metric.primary = currentState.primary.buckets.reduce((acc, state) => {
              if (state.key) acc += state.doc_count;
              return acc;
            }, metric.primary);
            metric.replica = currentState.primary.buckets.reduce((acc, state) => {
              if (!state.key) acc += state.doc_count;
              return acc;
            }, metric.replica);
          });
        }

        function processIndexShards(bucket) {
          const metric = createNewMetric();
          setStats(bucket, metric, { key: 'STARTED' });
          setStats(bucket, metric.unassigned, (b) => b.key !== 'STARTED');
          data.totals.primary += metric.primary;
          data.totals.replica += metric.replica;
          data.totals.unassigned.primary += metric.unassigned.primary;
          data.totals.unassigned.replica += metric.unassigned.replica;
          if (metric.unassigned.replica) metric.status = 'yellow';
          if (metric.unassigned.primary) metric.status = 'red';
          data[bucket.key] = metric;
        };

        function processNodeShards(cluster) {
          return (bucket) => {
            if (cluster.nodes[bucket.key]) {
              cluster.nodes[bucket.key].shard_count = bucket.doc_count;
              cluster.nodes[bucket.key].index_count = bucket.index_count.value;
            }
          };
        }

        if (resp && resp.hits && resp.hits.total !== 0) {
          const clusterUuid = resp.aggregations.indices.meta.cluster_uuid;
          const cluster = _.find(clusters, { cluster_uuid: clusterUuid });
          resp.aggregations.indices.buckets.forEach(processIndexShards);
          resp.aggregations.nodes.buckets.forEach(processNodeShards(cluster));
          cluster.shardStats = data;
        }
      });
      return clusters;
    });
  };
};

