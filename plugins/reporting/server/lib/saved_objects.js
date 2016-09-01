const url = require('url');
const _ = require('lodash');
const Joi = require('joi');
const parseKibanaState = require('../../../../server/lib/kibana_state');
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
          hash: '/dashboard/' + uriEncode.string(id, true),
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
      stateIndex: 'uiStateJSON',
    },
    visualization: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibanaApp,
          hash: '/visualize/edit/' + uriEncode.string(id, true),
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
      stateIndex: 'uiStateJSON',
    },
    search: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibanaApp,
          hash: '/discover/' + uriEncode.string(id, true),
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
          const app = appTypes[this.type];
          if (!app) throw new Error('Unexpected app type: ' + this.type);

          // map panel state to panel from app state part of the query
          const cleanQuery = this.getState(query);

          // modify the global state in the query
          const globalState = parseKibanaState(query, 'global');
          if (globalState.exists) {
            globalState.removeProps('refreshInterval');
            _.assign(cleanQuery, globalState.toQuery());
          }

          const urlParams = _.assign({
            protocol: opts.protocol,
            hostname: opts.hostname,
            port: opts.port,
          }, app.getUrlParams(this.id));

          // Kibana appends querystrings to the hash, and parses them as such,
          // so we'll do the same internally so kibana understands what we want
          // const encoder = (str) => str;
          // const unencodedQueryString = qs.stringify(cleanQuery, null, null, { encodeURIComponent: encoder });
          const unencodedQueryString = uriEncode.stringify(cleanQuery);
          urlParams.hash += '?' + unencodedQueryString;

          return url.format(urlParams);
        },
        getState: function mergeQueryState(query = {}) {
          const appState = parseKibanaState(query, 'app');
          if (!appState.exists || !this.panelIndex) return query;

          appState.removeProps(['uiState', 'panels', 'vis']);
          const panel = _.find(appState.get('panels', []), { panelIndex: this.panelIndex });
          const panelState = appState.get(['uiState', `P-${this.panelIndex}`]);

          // if uiState doesn't match panel, simply strip uiState
          if (panel && panelState) {
            appState.set('uiState', _.merge({}, this.uiState, panelState));
          }

          return _.assign({}, query, appState.toQuery());
        },
        toJSON: function (query) {
          const savedObj = {
            id: this.id,
            type: this.type,
            searchSource: this.searchSource,
            uiState: this.uiState,
            url: this.getUrl(query)
          };

          fields.forEach((field) => {
            savedObj[field] = this[field];
          });

          return savedObj;
        }
      });

      return obj;
    })
    .catch(() => {
      const isMissing = true;
      const savedObj = {
        id,
        type,
        isMissing,
        toJSON() {
          return {
            id,
            type,
            isMissing
          };
        }
      };
      return savedObj;
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
