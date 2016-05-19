const { get } = require('lodash');
const { QUEUE_INDEX, QUEUE_DOCTYPE } = require('./constants');
const defaultSize = 20;

module.exports = (server) => {
  const esErrors = server.plugins.elasticsearch.errors;
  const client = server.plugins.elasticsearch.client;

  function execQuery(type, body) {
    const defaultBody = {
      _source : {
        exclude: [ 'output.content', 'payload' ]
      },
      sort: [
        { priority: { order: 'asc' }},
        { created_at: { order: 'asc' }}
      ],
      size: defaultSize,
    };

    const query = {
      index: `${QUEUE_INDEX}-*`,
      type: QUEUE_DOCTYPE,
      body: Object.assign(defaultBody, body)
    };

    return client[type](query)
    .catch((err) => {
      if (err instanceof esErrors.NotFound) return;
      throw err;
    });
  }

  function getHits(query) {
    return query.then((res) => get(res, 'hits.hits', []));
  }

  return {
    list(user, page = 0, size = defaultSize) {
      user = user || null;

      const body = {
        query: {
          constant_score: {
            filter: {
              term: { created_by: user.username }
            }
          }
        },
        from: size * page,
        size: size,
      };

      return getHits(execQuery('search', body));
    }
  };
};