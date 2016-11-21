/*
 ************************************************************
 *                                                          *
 * Contents of file Copyright (c) Prelert Ltd 2006-2016     *
 *                                                          *
 *----------------------------------------------------------*
 *----------------------------------------------------------*
 * WARNING:                                                 *
 * THIS FILE CONTAINS UNPUBLISHED PROPRIETARY               *
 * SOURCE CODE WHICH IS THE PROPERTY OF PRELERT LTD AND     *
 * PARENT OR SUBSIDIARY COMPANIES.                          *
 * PLEASE READ THE FOLLOWING AND TAKE CAREFUL NOTE:         *
 *                                                          *
 * This source code is confidential and any person who      *
 * receives a copy of it, or believes that they are viewing *
 * it without permission is asked to notify Prelert Ltd     *
 * on +44 (0)20 3567 1249 or email to legal@prelert.com.    *
 * All intellectual property rights in this source code     *
 * are owned by Prelert Ltd.  No part of this source code   *
 * may be reproduced, adapted or transmitted in any form or *
 * by any means, electronic, mechanical, photocopying,      *
 * recording or otherwise.                                  *
 *                                                          *
 *----------------------------------------------------------*
 *                                                          *
 *                                                          *
 ************************************************************
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
          var config = server.config();
          return {
            kbnIndex: config.get('kibana.index'),
            tilemap: config.get('tilemap')
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

      var prelertConfig = readPrelertConfig();
      // Configure a configuration route that supplies the value of the
      // reporting.enabled property from the prelert.yml config file.
      var reportingEnabled = _.get(prelertConfig, 'reporting.enabled', true);
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
