const _ = require('lodash');
const createQuery = require('./create_query.js');
module.exports = (req, indices) => {
  const callWithRequest = req.server.plugins.elasticsearch.callWithRequest;
  const start = req.payload.timeRange.min;
  const end = req.payload.timeRange.max;
  const clusterUuid = req.params.clusterUuid;

  const params = {
    index: indices,
    type: 'cluster_state',
    ignore: [404],
    body: {
      size: 1,
      sort: { timestamp: { order: 'desc' } },
      query: createQuery({
        end: end,
        clusterUuid: clusterUuid
      })
    }
  };

  return callWithRequest(req, 'search', params)
  .then((resp) => {
    let total = _.get(resp, 'hits.total', 0);
    if (total) {
      return resp.hits.hits[0]._source;
    }
  });

};
