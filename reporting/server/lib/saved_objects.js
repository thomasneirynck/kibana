var url = require('url');
var _ = require('lodash');
var debug = require('./logger');
var services = require('./services');
var config = require('./kibana_config');

module.exports = function (client) {
  return {
    dashboard: dashboard,
    search: search,
    visualization: visualization,
    dashboardPanels: dashboardPanels,
  };

  function _getRecord(body) {
    return body._source;
  }

  function dashboard(dashId) {
    var req = {
      index: config.get('kibana.index'),
      type: 'dashboard',
      id: dashId
    };

    return client.get(req).then(_getRecord)
    .then(function (source) {
      var fields = ['title', 'description'];
      var obj = Object.assign(_.pick(source, fields), {
        id: dashId,
        getUrl: (query = {}) => services.getAppUrl('dashboard', dashId, query),
      });

      return obj;
    });
  }

  function visualization(visId, params = {}) {
    var req = {
      index: config.get('kibana.index'),
      type: 'visualization',
      id: visId
    };

    return client.get(req).then(_getRecord)
    .then(function (source) {
      var fields = ['title', 'description'];
      var obj = Object.assign(_.pick(source, fields), {
        id: visId,
        getUrl: (query = {}) => services.getAppUrl('visualization', visId, query),
      });

      return obj;
    });
  }

  function search(searchId, params = {}) {
    var req = {
      index: config.get('kibana.index'),
      type: 'search',
      id: searchId
    };

    return client.get(req).then(_getRecord)
    .then(function (source) {
      var fields = ['title', 'description'];
      var obj = _.pick(source, fields);
      obj.getUrl = (query = {}) => services.getAppUrl('search', searchId, query);

      return obj;
    });
  }

  function dashboardPanels(dashId, params = {}) {
    return dashboard(dashId)
    .then(function (source) {
      var fields = ['id', 'type', 'panelIndex'];
      var panels = JSON.parse(source.panelsJSON);

      return _.map(panels, function (panel) {
        var panel = _.pick(panel, fields);
        panel.url = services.getAppUrl(panel.type, panel.id);

        return panel;
      });
    });
  }
};
