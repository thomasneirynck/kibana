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

import _ from 'lodash';
import createProxy from '../../src/core_plugins/elasticsearch/lib/create_proxy';
import initializationChecks from './lib/initialization_checks';
import readPrelertConfig from './lib/read_prelert_config';

module.exports = function (kibana) {

  return new kibana.Plugin({
    require: ['kibana', 'elasticsearch'],

    uiExports: {
      app: {
        id: 'prelert',
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
      ]
    },


    init: function (server, options) {

      createProxy(server, 'PUT', '/_xpack/prelert/{paths*}');
      createProxy(server, 'POST', '/_xpack/prelert/{paths*}');
      createProxy(server, 'DELETE', '/_xpack/prelert/{paths*}');

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
