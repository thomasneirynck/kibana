const moment = require('moment');
const { get } = require('lodash');
const constants = require('./constants');
const getUser = require('./get_user');
const getObjectQueueFactory = require('./get_object_queue');

module.exports = function (server) {
  const getObjectQueue = getObjectQueueFactory(server);
  const queueConfig = server.config().get('xpack.reporting.queue');
  const jobQueue = server.plugins.reporting.queue;
  const { JOBTYPES_PRINTABLE_PDF } = constants;

  const jobTypes = {};

  jobTypes[JOBTYPES_PRINTABLE_PDF] = function (objectType, request) {
    const date = moment().toISOString();
    const objId = request.params.savedId;
    const query = request.query;

    const headers = {
      authorization: request.headers.authorization
    };

    return getUser(server, request)
    .then((user) => {
      // get resulting kibana saved object documents
      return getObjectQueue(objectType, objId)
      .then(function (objectQueue) {
        server.log(['reporting', 'debug'], `${objectQueue.length} saved object(s) to process`);

        const savedObjects = objectQueue.objects.map((savedObj) => savedObj.toJSON(query));

        const payload = {
          id: objectQueue.id,
          title: objectQueue.title,
          description: objectQueue.description,
          type: objectQueue.type,
          objects: savedObjects,
          date,
          query,
          headers,
        };

        const options = {
          timeout: queueConfig.timeout * objectQueue.length,
          created_by: get(user, 'username', false),
        };

        return jobQueue.addJob(JOBTYPES_PRINTABLE_PDF, payload, options);
      });
    });
  };

  return jobTypes;
};

