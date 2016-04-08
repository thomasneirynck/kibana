const url = require('url');
const rison = require('rison-node');
const _ = require('lodash');
const Joi = require('joi');
const uriEncode = require('./uri_encode');

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
      stateIndex: 'uiStateJSON',
    },
    visualization: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibanaApp,
          hash: '/visualize/edit/' + id,
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
      stateIndex: 'uiStateJSON',
    },
    search: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibanaApp,
          hash: '/discover/' + id,
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
      stateIndex: 'uiStateJSON',
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
    .then(function _buildObject(source) {
      const searchSource = JSON.parse(_.get(source, appTypes[type].searchSourceIndex, '{}'));
      const uiState = JSON.parse(_.get(source, appTypes[type].stateIndex, '{}'));

      const obj = _.assign(_.pick(source, fields), {
        id: req.id,
        type: type,
        searchSource: searchSource,
        uiState: uiState,
        getUrl: function getAppUrl(query = {}) {
          const { id, type } = this;

          const app = appTypes[type];
          if (!app) throw new Error('Unexpected app type: ' + type);

          // map panel state to panel from app state part of the query
          const cleanQuery = this.getState(query);

          // strip the refresh value from the global state
          if (query._g) {
            const globalState = rison.decode(query._g);
            delete globalState.refreshInterval;
            _.assign(cleanQuery, { _g: rison.encode(globalState) });
          }

          const urlParams = _.assign({
            protocol: opts.protocol,
            hostname: opts.hostname,
            port: opts.port,
          }, app.getUrlParams(id));

          // Kibana appends querystrings to the hash, and parses them as such,
          // so we'll do the same internally so kibana understands what we want
          // const encoder = (str) => str;
          // const unencodedQueryString = qs.stringify(cleanQuery, null, null, { encodeURIComponent: encoder });
          const unencodedQueryString = uriEncode.stringify(cleanQuery);
          urlParams.hash += '?' + unencodedQueryString;

          return url.format(urlParams);
        },
        getState: function mergeQueryState(query = {}) {
          if (!query._a || !this.panelIndex) return query;

          const appState = rison.decode(query._a);
          const correctedState = _.omit(appState, ['uiState', 'panels', 'vis']);
          const panel = _.find(appState.panels, { panelIndex: this.panelIndex });
          const panelState = appState.uiState[`P-${this.panelIndex}`];

          // if uiState doesn't match panel, simply strip uiState
          if (panel && panelState) {
            correctedState.uiState = _.merge({}, this.uiState, panelState);
          }

          return _.defaults({ _a: rison.encode(correctedState) }, query);
        }
      });

      return obj;
    });
  }

  function validateType(type) {
    const app = appTypes[type];
    if (!app) throw new Error('Invalid object type: ' + type);
  }

  // exported methods
  return {
    get: getObject
  };
};
