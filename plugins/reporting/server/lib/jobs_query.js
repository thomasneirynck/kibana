const { get } = require('lodash');
const { QUEUE_INDEX, QUEUE_DOCTYPE } = require('./constants');
const getUserFactory = require('./get_user');
const oncePerServer = require('./once_per_server');
const defaultSize = 10;

function jobsQueryFactory(server) {
  const getUser = getUserFactory(server);
  const esErrors = server.plugins.elasticsearch.errors;
  const { callWithRequest } = server.plugins.elasticsearch;
  const NO_USER_IDENTIFIER = false;

  function execQuery(type, body, request) {
    const defaultBody = {
      search: {
        _source : {
          exclude: [ 'output.content' ]
        },
        sort: [
          { created_at: { order: 'desc' }}
        ],
        size: defaultSize,
      }
    };

    const query = {
      index: `${QUEUE_INDEX}-*`,
      type: QUEUE_DOCTYPE,
      body: Object.assign(defaultBody[type] || {}, body)
    };

    return callWithRequest(request, type, query)
    .catch((err) => {
      if (err instanceof esErrors.NotFound) return;
      throw err;
    });
  }

  function getHits(query) {
    return query.then((res) => get(res, 'hits.hits', []));
  }

  return {
    list(request, page = 0, size = defaultSize) {
      return getUser(request)
      .then((user) => {
        const username = get(user, 'username', NO_USER_IDENTIFIER);

        const body = {
          query: {
            constant_score: {
              filter: {
                bool: {
                  should: [
                    { term: { created_by: username } },
                    { term: { created_by: NO_USER_IDENTIFIER } },
                  ]
                }
              }
            }
          },
          from: size * page,
          size: size,
        };

        return getHits(execQuery('search', body));
      });
    },

    listCompletedSince(request, size = defaultSize, sinceInMs) {
      return getUser(request)
      .then((user) => {
        const username = get(user, 'username', NO_USER_IDENTIFIER);

        const body = {
          query: {
            constant_score: {
              filter: {
                bool: {
                  should: [
                    { term: { created_by: username } },
                    { term: { created_by: NO_USER_IDENTIFIER } },
                  ],
                  must: [
                    { range: { completed_at: { gt: sinceInMs, format: 'epoch_millis' } } }
                  ]
                }
              }
            }
          },
          size: size,
          sort: { completed_at: 'asc' }
        };

        return getHits(execQuery('search', body));
      });
    },

    count(request) {
      return getUser(request)
      .then((user) => {
        const username = get(user, 'username', NO_USER_IDENTIFIER);

        const body = {
          query: {
            constant_score: {
              filter: {
                bool: {
                  should: [
                    { term: { created_by: username } },
                    { term: { created_by: NO_USER_IDENTIFIER } },
                  ]
                }
              }
            }
          }
        };

        return execQuery('count', body)
        .then((doc) => {
          if (!doc) return 0;
          return doc.count;
        });
      });
    },

    get(request, id, includeContent = false) {
      return getUser(request)
      .then((user) => {
        if (!id) return;
        const username = get(user, 'username', NO_USER_IDENTIFIER);

        const body = {
          query: {
            constant_score: {
              filter: {
                bool: {
                  should: [
                    { term: { created_by: NO_USER_IDENTIFIER } },
                    { term: { created_by: username } },
                  ],
                  filter: [
                    { term: { _id: id } },
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

        return getHits(execQuery('search', body))
        .then((hits) => {
          if (hits.length !== 1) return;
          return hits[0];
        });
      });
    }
  };
}

module.exports = oncePerServer(jobsQueryFactory);