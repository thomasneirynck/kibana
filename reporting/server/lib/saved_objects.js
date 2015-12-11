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
      type: "dashboard",
      id: dashId
    };

    return client.get(req).then(_getRecord);
  }

  function visualization(visId) {
    var req = {
      index: config.get('kibana.index'),
      type: "visualization",
      id: visId
    };

    return client.get(req).then(_getRecord)
    .then(function (source) {
      var fields = ['title', 'description'];
      var obj = _.pick(source, fields);
      obj.url = services.getUrl('visualization', visId);

      return obj;
    });
  }

  function search(searchId) {
    var req = {
      index: config.get('kibana.index'),
      type: "search",
      id: searchId
    };

    return client.get(req).then(_getRecord)
    .then(function (source) {
      var fields = ['title', 'description'];
      var obj = _.pick(source, fields);
      obj.url = services.getUrl('search', searchId);

      return obj;
    });
  }

  function dashboardPanels(dashId) {
    return dashboard(dashId)
    .then(function (source) {
      var fields = ['id', 'type', 'panelIndex'];
      var panels = JSON.parse(source.panelsJSON);

      return _.map(panels, function (panel) {
        var panel = _.pick(panel, fields);
        panel.url = services.getUrl(panel.type, panel.id);

        return panel;
      });
    });
  }
};
