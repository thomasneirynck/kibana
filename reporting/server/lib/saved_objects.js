const url = require('url');
const _ = require('lodash');
const debug = require('./logger');

module.exports = function (client, config) {
  const opts = {
    kibana: {
      appPath: config.get('reporting.kibanaApp'),
      indexName: config.get('kibana.index'),
    },
    server: {
      hostname: config.get('server.host'),
      port: config.get('server.port'),
    }
  };

  const appTypes = {
    dashboard: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibana.appPath,
          hash: '/dashboard/' + id,
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
    },
    visualization: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibana.appPath,
          hash: '/visualize/edit/' + id,
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
    },
    search: {
      getUrlParams: function (id) {
        return {
          pathname: opts.kibana.appPath,
          hash: '/discover/' + id,
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
    }
  };

  return {
    get: getObject
  };

  function getObject(type, id, fields = []) {
    fields = ['title', 'description'].concat(fields);
    validateType(type);
    const req = {
      index: opts.kibana.indexName,
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
        getUrl: (query = {}) => getAppUrl(type, req.id, query),
        searchSource: searchSource,
      });

      return obj;
    });
  }

  function getAppUrl(type, id, query = {}) {
    const app = appTypes[type];
    if (!app) throw new Error('Unexpected app type: ' + type);

    const urlParams = _.assign({
      // TODO: get protocol from the server config
      protocol: 'http',
      hostname: opts.server.hostname,
      port: opts.server.port,
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

  function dashboardPanels(dashId, params = {}) {
    return getObject('dashboard', dashId)
    .then(function (source) {
      const fields = ['id', 'type', 'panelIndex'];
      const panels = JSON.parse(source.panelsJSON);

      return _.map(panels, function (panel) {
        const url = getAppUrl(panel.type, panel.id);
        return _.assign(_.pick(panel, fields), { url });
      });
    });
  }
};
