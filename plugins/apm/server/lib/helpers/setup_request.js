import moment from 'moment';

export function setupRequest(req, reply) {
  const cluster = req.server.plugins.elasticsearch.getCluster('data');

  const setup = {
    start: moment.utc(req.query.start).valueOf(),
    end: moment.utc(req.query.end).valueOf(),
    client: cluster.callWithRequest.bind(null, req),
    config: req.server.config()
  };

  reply(setup);
}
