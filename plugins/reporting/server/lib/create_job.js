const Promise = require('bluebird');
const moment = require('moment');
const getObjectQueue = require('./get_object_queue');

module.exports = (server) => {
  const fetchObjectQueue = getObjectQueue(server);

  return function createJob(jobType, objectType, objId, query, headers) {
    const queue = server.plugins.reporting.queue;
    const date = moment().toISOString();

    // get resulting kibana saved object documents
    return fetchObjectQueue(objectType, objId)
    .then(function (objectQueue) {
      server.log(['reporting', 'debug'], `${objectQueue.length} saved object(s) to process`);

      return Promise.map(objectQueue, function (savedObj) {
        return savedObj.toJSON(query);
      })
      .then(function (objects) {
        // TODO: check for current user
        return queue.addJob(jobType, { objects, query, headers, date });
      });
    });
  };
};
