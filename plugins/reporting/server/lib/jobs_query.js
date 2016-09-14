const { get, set } = require('lodash');
const oncePerServer = require('./once_per_server');
const { QUEUE_INDEX, QUEUE_DOCTYPE } = require('./constants');
const getUserFactory = require('../lib/get_user');
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
          excludes: [ 'output.content' ]
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
      if (err instanceof esErrors['401']) return;
      if (err instanceof esErrors['403']) return;
      if (err instanceof esErrors['404']) return;
      throw err;
    });
  }

  function getHits(query) {
    return query.then((res) => get(res, 'hits.hits', []));
  }

  return {
    list(request, page = 0, size = defaultSize) {
      const showAll = get(request, 'query.all', false);

      return getUser(request)
      .then((user) => {
        const username = get(user, 'username', NO_USER_IDENTIFIER);

        const body = {
          size,
          from: size * page,
        };

        if (!showAll) {
          set(body, 'query', {
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
          });
        }

        return getHits(execQuery('search', body, request));
      });
    },

    listCompletedSince(request, size = defaultSize, sinceInMs) {
      return getUser(request)
      .then((user) => {
        const username = get(user, 'username', NO_USER_IDENTIFIER);

        const body = {
          size,
          sort: { completed_at: 'asc' },
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
        };

        return getHits(execQuery('search', body, request));
      });
    },

    count(request) {
      const showAll = get(request, 'query.all', false);

      return getUser(request)
      .then((user) => {
        const username = get(user, 'username', NO_USER_IDENTIFIER);

        const body = (showAll) ? {} : {
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

        return execQuery('count', body, request)
        .then((doc) => {
          if (!doc) return 0;
          return doc.count;
        });
      });
    },

    get(request, id, includeContent = false) {
      if (!id) return Promise.resolve();

      return getUser(request)
      .then(() => {
        if (!id) return;

        const body = {
          size: 1,
        };

        if (includeContent) {
          body._source = {
            excludes: []
          };
        }

        return getHits(execQuery('search', body, request))
        .then((hits) => {
          if (hits.length !== 1) return;
          return hits[0];
        });
      });
    }
  };
}

module.exports = oncePerServer(jobsQueryFactory);