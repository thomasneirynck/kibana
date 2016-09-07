const Esqueue = require('esqueue');
const createWorker = require('./create_worker');
const { QUEUE_INDEX, QUEUE_DOCTYPE } = require('./constants');
const oncePerServer = require('./once_per_server');

const dateSeparator = '.';

function createQueueFactory(server) {
  const queueConfig = server.config().get('xpack.reporting.queue');
  const client = server.plugins.elasticsearch.client;

  const queue = new Esqueue(QUEUE_INDEX, {
    doctype: QUEUE_DOCTYPE,
    interval: queueConfig.indexInterval,
    timeout: queueConfig.timeout,
    dateSeparator: dateSeparator,
    client: client
  });

  createWorker(server)(queue);

  return queue;
}

module.exports = oncePerServer(createQueueFactory);