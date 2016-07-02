import { resolve } from 'path';
import Boom from 'boom';
var graphExploreRoute = require('./server/routes/graphExplore');
var getExampleDocsRoute = require('./server/routes/getExampleDocs');
import checkLicense from './server/lib/check_license';
import mirrorPluginStatus from '../../server/lib/mirror_plugin_status';

const APP_TITLE = 'Graph';

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
    require: ['kibana', 'elasticsearch', 'xpack_main'],
    uiExports: {
      app: {
        title: APP_TITLE,
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
      },
      hacks: ['plugins/graph/hacks/toggle_app_link_in_nav'],
    },
    //    noParse:[{ test:function(a){console.log("Debug",a); return /node_modules[\/\\]angular-contextmenu/.test(a); }}   ], //MH change

    config: function (Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
      }).default();
    },

    init: function (server, options) {
      const thisPlugin = this;
      const xpackMainPlugin = server.plugins.xpack_main;
      mirrorPluginStatus(xpackMainPlugin, thisPlugin);
      xpackMainPlugin.status.once('green', () => {
        // Register a function that is called whenever the xpack info changes,
        // to re-compute the license check results for this plugin
        xpackMainPlugin.info.feature(thisPlugin.id).registerLicenseCheckResultsGenerator(checkLicense);
      });

      // Add server routes and initalize the plugin here
      graphExploreRoute(server);
      getExampleDocsRoute(server);
    }
  });
};
