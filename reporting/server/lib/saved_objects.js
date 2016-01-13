const url = require('url');
const _ = require('lodash');
const Joi = require('joi');
const debug = require('./logger');

module.exports = function (client, config) {
  const schema = Joi.object().keys({
    kibanaApp: Joi.string().required(),
    kibanaIndex: Joi.string().required(),
    protocol: Joi.string().valid(['http', 'https']).default('http'),
    hostname: Joi.string().default('localhost'),
    port: Joi.number().integer().default(5601),
  });

  const result = Joi.validate(config, schema);

  if (result.error) throw result.error;
  const opts = result.value;

  const appTypes = {
    dashboard: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibanaApp,
          hash: '/dashboard/' + id,
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
    },
    visualization: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibanaApp,
          hash: '/visualize/edit/' + id,
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
    },
    search: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibanaApp,
          hash: '/discover/' + id,
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
    }
  };

  function getObject(type, id, fields = []) {
    fields = ['title', 'description'].concat(fields);
    validateType(type);
    const req = {
      index: opts.kibanaIndex,
      type: type,
      id: id
    };

    return client.get(req)
    .then(function _getRecord(body) {
      return body._source;
    })
    .then(function (source) {
      const searchSource = JSON.parse(_.get(source, appTypes[type].searchSourceIndex));

      const obj = _.assign(_.pick(source, fields), {
        id: req.id,
        type: type,
        searchSource: searchSource,
        getUrl: (query = {}) => getAppUrl(type, req.id, query),
      });

      return obj;
    });
  }

  function getAppUrl(type, id, query = {}) {
    const app = appTypes[type];
    if (!app) throw new Error('Unexpected app type: ' + type);

    const urlParams = _.assign({
      protocol: opts.protocol,
      hostname: opts.hostname,
      port: opts.port,
    }, app.getUrlParams(id));

    // Kibana appends querystrings to the hash, and parses them as such,
    // so we'll do the same internally so kibana understands what we want
    urlParams.hash += url.format({ query });

    return url.format(urlParams);
  };

  function validateType(type) {
    const app = appTypes[type];
    if (!app) throw new Error('Invalid object type: ' + type);
  }

  // exported methods
  return {
    get: getObject
  };
};
