const Esqueue = require('esqueue');
const createWorker = require('./create_worker');
const { QUEUE_INDEX } = require('./constants');

function createQueue(server) {
  const queueConfig = server.config().get('xpack.reporting.queue');
  const client = server.plugins.elasticsearch.client;

  const queue = new Esqueue(QUEUE_INDEX, {
    interval: queueConfig.indexInterval,
    timeout: queueConfig.timeout,
    client: client
  });

  createWorker(server)(queue);

  return queue;
}

module.exports = createQueue;