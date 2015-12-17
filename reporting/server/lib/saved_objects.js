var url = require('url');
var _ = require('lodash');
var debug = require('./logger');

module.exports = function (config, client) {
  var appTypes = {
    dashboard: {
      getUrlParams: function (id) {
        return {
          pathname: config.get('reporting.kibanaApp'),
          hash: '/dashboard/' + id,
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
    },
    visualization: {
      getUrlParams: function (id) {
        return {
          pathname: config.get('reporting.kibanaApp'),
          hash: '/visualize/edit/' + id,
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
    },
    search: {
      getUrlParams: function (id) {
        return {
          pathname: config.get('reporting.kibanaApp'),
          hash: '/discover/' + id,
        };
      },
      searchSourceIndex: 'kibanaSavedObjectMeta.searchSourceJSON',
    }
  };

  return {
    dashboard: dashboard,
    search: search,
    visualization: visualization,
    dashboardPanels: dashboardPanels,
  };

  function getObject(req, fields = ['title', 'description']) {
    var { type } = req;

    return client.get(req)
    .then(function _getRecord(body) {
      return body._source;
    })
    .then(function (source) {
      var searchSource = JSON.parse(_.get(source, appTypes[type].searchSourceIndex));

      var obj = _.assign(_.pick(source, fields), {
        id: req.id,
        getUrl: (query = {}) => getAppUrl(type, req.id, query),
        searchSource: searchSource,
      });

      return obj;
    });
  }

  function getAppUrl(type, id, query = {}) {
    var app = appTypes[type];
    if (!app) throw new Error('Unexpected app type: ' + type);

    var urlParams = _.assign({
      // TODO: get protocol from the server config
      protocol: 'http',
      hostname: config.get('server.host'),
      port: config.get('server.port'),
    }, app.getUrlParams(id));

    // Kibana appends querystrings to the hash, and parses them as such,
    // so we'll do the same internally so kibana understands what we want
    urlParams.hash += url.format({ query });

    return url.format(urlParams);
  };

  function dashboard(dashId) {
    return getObject({
      index: config.get('kibana.index'),
      type: 'dashboard',
      id: dashId
    });
  }

  function visualization(visId, params = {}) {
    return getObject({
      index: config.get('kibana.index'),
      type: 'visualization',
      id: visId
    });
  }

  function search(searchId, params = {}) {
    return getObject({
      index: config.get('kibana.index'),
      type: 'search',
      id: searchId
    });
  }

  function dashboardPanels(dashId, params = {}) {
    return dashboard(dashId)
    .then(function (source) {
      var fields = ['id', 'type', 'panelIndex'];
      var panels = JSON.parse(source.panelsJSON);

      return _.map(panels, function (panel) {
        var panel = _.pick(panel, fields);
        panel.url = getAppUrl(panel.type, panel.id);

        return panel;
      });
    });
  }
};
