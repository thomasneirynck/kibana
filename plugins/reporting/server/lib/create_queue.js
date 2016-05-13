const Esqueue = require('esqueue');

function createQueue(server) {
  const config = server.config();
  const queueConfig = config.get('xpack.reporting.queue');
  const client = server.plugins.elasticsearch.client;

  const queue = new Esqueue(queueConfig.index, {
    interval: queueConfig.indexInterval,
    timeout: queueConfig.timeout,
    client: client
  });

  return queue;
}

module.exports = createQueue;