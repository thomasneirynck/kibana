var url = require('url');
var debug = require('./logger');
var kibanaConfig = require('./kibana_config');

var appTypes = {
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

var getAppUrl = module.exports.getAppUrl = function getAppUrl(type, id, query={}) {
  var app = appTypes[type];
  if (!app) throw new Error('Unexpected app type: ' + type);

  var urlParams = Object.assign({
    // TODO: get protocol from the server config
    protocol: 'http',
    hostname: kibanaConfig.get('server.host'),
    port: kibanaConfig.get('server.port'),
  }, app(id).url);

  // Kibana appends querystrings to the hash, and parses them as such,
  // so we'll do the same internally so kibana understands what we want
  urlParams.hash += url.format({ query });

  return url.format(urlParams);
}
