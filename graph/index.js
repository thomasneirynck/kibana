var getIndicesRoute = require('./server/routes/getIndices');
var getFieldsRoute = require('./server/routes/getFields');
var graphExploreRoute = require('./server/routes/graphExplore');
var getExampleDocsRoute = require('./server/routes/getExampleDocs');
module.exports = function (kibana) {

    //2.x bootstrap code copied from https://github.com/elastic/timelion/pull/57/files
    var mainFile = 'plugins/graphui-plugin/app';
     var ownDescriptor = Object.getOwnPropertyDescriptor(kibana, 'autoload');
     var protoDescriptor = Object.getOwnPropertyDescriptor(kibana.constructor.prototype, 'autoload');
     var descriptor = ownDescriptor || protoDescriptor || {};
     if (descriptor.get) {
       // the autoload list has been replaced with a getter that complains about
       // improper access, bypass that getter by seeing if it is defined
       mainFile = 'plugins/graphui-plugin/app_with_autoload';
     }



  return new kibana.Plugin({
    id: 'graph',
    configPrefix: 'xpack.graph',
    require: ['kibana', 'elasticsearch'],
    uiExports: {
      app: {
        title: 'Graph',
        icon: 'plugins/graphui-plugin/icon.png',
        description: 'Graph exploration',
//2.x        main: 'plugins/graphui-plugin/app',
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
      // Add server routes and initalize the plugin here
      getIndicesRoute(server);
      getFieldsRoute(server);
      graphExploreRoute(server);
      getExampleDocsRoute(server);
    }

  });
};
