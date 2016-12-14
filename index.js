/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2016 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import path from 'path';
import _ from 'lodash';
import createProxy from './lib/create_proxy';
import initializationChecks from './lib/initialization_checks';
import readPrelertConfig from './lib/read_prelert_config';

module.exports = function (kibana) {

  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch'],

    uiExports: {
      app: {
        title: 'Prelert',
        description: 'Prelert behavioral analytics for machine data',
        icon: 'plugins/prelert/prelert-white.png',
        main: 'plugins/prelert/app',
        uses: [
          'visTypes',
          'spyModes'
        ],
        injectVars: function (server, options) {
          const config = server.config();
          return {
            kbnIndex: config.get('kibana.index'),
            tilemap: config.get('tilemap'),
            esServerUrl: config.get('elasticsearch.url'),
          };
        }
      },
      visTypes: [
        'plugins/prelert/prelert_vis_types'
      ],
      modules: {
        pako$: {
          path: path.resolve(__dirname, 'bower_components/pako/index.js'),
        },
        jszip$: {
          path: path.resolve(__dirname, 'bower_components/jszip/lib/index.js'),
        }
      }
    },


    init: function (server, options) {

      createProxy(server, 'GET', 'prelert/{paths*}');
      createProxy(server, 'POST', 'prelert/{paths*}');
      createProxy(server, 'PUT', 'prelert/{paths*}');
      createProxy(server, 'DELETE', 'prelert/{paths*}');
      createProxy(server, 'GET', 'prelert_ext/{paths*}');
      createProxy(server, 'POST', 'prelert_ext/{paths*}');
      createProxy(server, 'GET', 'prelert_support/{paths*}');

      const prelertConfig = readPrelertConfig();
      // Configure a configuration route that supplies the value of the
      // reporting.enabled property from the prelert.yml config file.
      const reportingEnabled = _.get(prelertConfig, 'reporting.enabled', true);
      server.route({
        method: 'GET',
        path: '/prelert_config/reporting_enabled',
        handler: function (request, reply) {
          reply({'reportingEnabled':reportingEnabled});
        }
      });

      initializationChecks(this, server).start();
    }


  });
};
