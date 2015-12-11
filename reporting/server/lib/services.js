var url = require('url');
var debug = require('./logger');
var kibanaConfig = require('./kibana_config');

var panelTypes = {
  dashboard: function (id) {
    return {
      url: {
        pathname: kibanaConfig.get('reporting.kibanaApp'),
        hash: '/dashboard/' + id,
      }
    }
  },
  visualization: function (id) {
    return {
      url: {
        pathname: kibanaConfig.get('reporting.kibanaApp'),
        hash: '/visualize/edit/' + id,
      }
    };
  },
  search: function (id) {
    return {
      url: {
        pathname: kibanaConfig.get('reporting.kibanaApp'),
        hash: '/discover/' + id,
      }
    };
  }
};

module.exports = {
  getUrl: getUrl,
};

function getUrl(type, id) {
  var panel = panelTypes[type];
  if (!panel) throw new Error('Unexpected panel type: ' + type);

  var urlParams = Object.assign({
    // TODO: get protocol from the server config
    protocol: 'http',
    hostname: kibanaConfig.get('server.host'),
    port: kibanaConfig.get('server.port'),
  }, panel(id).url);

  return url.format(urlParams);
}
