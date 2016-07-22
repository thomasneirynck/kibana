const { get } = require('lodash');
const oncePerServer = require('./once_per_server');
const { QUEUE_INDEX, QUEUE_DOCTYPE } = require('./constants');
const getUserFactory = require('../lib/get_user');
const defaultSize = 10;

function jobsQueryFactory(server) {
  const esErrors = server.plugins.elasticsearch.errors;
  const client = server.plugins.elasticsearch.client;
  const getUser = getUserFactory(server);
  const nouser = false;

  function execQuery(type, body) {
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
    list(request, page = 0, size = defaultSize) {
      getUser(request)
      .then((user) => {
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
      });
    },

    listCompletedSince(request, size = defaultSize, sinceInMs) {
      getUser(request)
      .then((user) => {
        const username = get(user, 'username', nouser);

        const body = {
          query: {
            constant_score: {
              filter: {
                bool: {
                  should: [
                    { term: { created_by: username } },
                    { term: { created_by: nouser } },
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
      getUser(request)
      .then((user) => {
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
      if (!id) return Promise.resolve();

      getUser(request)
      .then((user) => {
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