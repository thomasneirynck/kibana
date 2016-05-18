import { resolve } from 'path';
import Boom from 'boom';
var graphExploreRoute = require('./server/routes/graphExplore');
var getExampleDocsRoute = require('./server/routes/getExampleDocs');
import checkLicense from './server/lib/check_license';

module.exports = function (kibana) {

    //2.x bootstrap code copied from https://github.com/elastic/timelion/pull/57/files
  var mainFile = 'plugins/graph/app';
  var ownDescriptor = Object.getOwnPropertyDescriptor(kibana, 'autoload');
  var protoDescriptor = Object.getOwnPropertyDescriptor(kibana.constructor.prototype, 'autoload');
  var descriptor = ownDescriptor || protoDescriptor || {};
  if (descriptor.get) {
    // the autoload list has been replaced with a getter that complains about
    // improper access, bypass that getter by seeing if it is defined
    mainFile = 'plugins/graph/app_with_autoload';
  }



  return new kibana.Plugin({
    id: 'graph',
    configPrefix: 'xpack.graph',
    publicDir: resolve(__dirname, 'public'),
    require: ['kibana', 'elasticsearch', 'xpackMain'],
    uiExports: {
      app: {
        title: 'Graph',
        icon: 'plugins/graph/icon.png',
        description: 'Graph exploration',
        //2.x        main: 'plugins/graph/app',
        main: mainFile, //2.x
        injectVars: function (server, options) {
          var config = server.config();
          return {
            kbnIndex: config.get('kibana.index'),
            esApiVersion: config.get('elasticsearch.apiVersion'),
            esShardTimeout: config.get('elasticsearch.shardTimeout')
          };
        }
      }
    },
    //    noParse:[{ test:function(a){console.log("Debug",a); return /node_modules[\/\\]angular-contextmenu/.test(a); }}   ], //MH change

    config: function (Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init: function (server, options) {
      const xpackMainPluginStatus = server.plugins.xpackMain.status;
      if (xpackMainPluginStatus.state === 'red') {
        this.status.red(xpackMainPluginStatus.message);
        return;
      };

      const licenseCheckResults = checkLicense(server.plugins.xpackMain.info);
      if (!licenseCheckResults.showGraphFeatures) {
        // Remove graph app icon from nav
        kibana.uiExports.navLinks.inOrder.forEach((navLink) => {
          if (navLink.title === 'Graph') {
            kibana.uiExports.navLinks.delete(navLink);
          }
        });
      }

      // Add server routes and initalize the plugin here
      const commonRouteConfig = {
        pre: [
          function forbidApiAccess(request, reply) {
            if (!licenseCheckResults.showGraphFeatures || licenseCheckResults.shouldUpsellUser) {
              reply(Boom.forbidden('License has expired '
                + 'OR graph is not available with this license '
                + 'OR graph has been disabled in Elasticsearch'));
            } else {
              reply();
            }
          }
        ]
      };
      graphExploreRoute(server, commonRouteConfig);
      getExampleDocsRoute(server, commonRouteConfig);
    }

  });
};
