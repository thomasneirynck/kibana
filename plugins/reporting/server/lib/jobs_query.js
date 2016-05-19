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
      const nouser = false;
      const username = get(user, 'username', nouser);

      const body = {
        query: {
          constant_score: {
            filter: {
              bool: {
                should: [
                  { term: { created_by: username } },
                  { term: { created_by: nouser } },
                ]
              }
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