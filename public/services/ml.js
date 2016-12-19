/**
 * @name ml
 *
 * @description This is the result of calling mlFactory. mlFactory is exposed by the
 * elasticsearch.angular.js client.
 */

import 'ml-browser';
import _ from 'lodash';
import uiModules from 'ui/modules';

let ml; // share the client amongst all apps
uiModules
  .get('kibana', ['elasticsearch', 'kibana/config'])
  .service('ml', function (mlFactory, esUrl, $q, esApiVersion, esRequestTimeout) {
    if (ml) return ml;

    ml = mlFactory({
      host: esUrl,
      log: 'info',
      requestTimeout: esRequestTimeout,
      apiVersion: 'master',
      plugins: [function (Client, config) {

        // mlFactory automatically injects the AngularConnector to the config
        // https://github.com/elastic/elasticsearch-js/blob/master/src/lib/connectors/angular.js
        _.class(CustomAngularConnector).inherits(config.connectionClass);
        function CustomAngularConnector(host, config) {
          CustomAngularConnector.Super.call(this, host, config);

          this.request = _.wrap(this.request, function (request, params, cb) {
            if (String(params.method).toUpperCase() === 'GET') {
              params.query = _.defaults({ _: Date.now() }, params.query);
            }

            return request.call(this, params, cb);
          });
        }

        config.connectionClass = CustomAngularConnector;

      }]
    });

    return ml;
  });
