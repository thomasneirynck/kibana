const { get } = require('lodash');
const { QUEUE_INDEX, QUEUE_DOCTYPE } = require('./constants');
const defaultSize = 20;

module.exports = (server) => {
  const esErrors = server.plugins.elasticsearch.errors;
  const client = server.plugins.elasticsearch.client;
  const nouser = false;

  function execQuery(body) {
    const defaultBody = {
      _source : {
        exclude: [ 'output.content', 'payload' ]
      },
      sort: [
        { created_at: { order: 'desc' }}
      ],
      size: defaultSize,
    };

    const query = {
      index: `${QUEUE_INDEX}-*`,
      type: QUEUE_DOCTYPE,
      body: Object.assign(defaultBody, body)
    };

    return client.search(query)
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

      return getHits(execQuery(body));
    },

    get(user, id, includeContent = false) {
      if (!id) return;
      const username = get(user, 'username', nouser);

      const body = {
        query: {
          constant_score: {
            filter: {
              bool: {
                should: [
                  { term: { created_by: nouser } },
                  { term: { created_by: username } },
                ],
                filter: [
                  { term: { _id: id } },
                  { term: { status: 'completed' } },
                ],
              }
            }
          }
        },
        size: 1,
      };

      if (includeContent) {
        body._source = {
          exclude: []
        };
      }

      return getHits(execQuery(body))
      .then((hits) => {
        if (hits.length !== 1) return;
        return hits[0];
      });
    }
  };
};