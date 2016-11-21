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

/*
 * Adds the pre-built Prelert dashboard objects (searches, visualizations, dashboards)
 * to the Kibana index in Elasticsearch. These objects are loaded from three JSON files
 * in the dashboard_objects sub-directory.
 */

import _ from 'lodash';
import searches from './dashboard_objects/searches.json';
import visualizations from './dashboard_objects/visualizations.json';
import dashboards from './dashboard_objects/dashboards.json';

module.exports = function (server, plugin) {
  var client = server.plugins.elasticsearch.client;
  var index = server.config().get('kibana.index');

  function createObject(id, type, source){
    client.create({
      index: index,
      type: type,
      id: id,
      body: source
    }, function (error, response) {
        if (error) {
          plugin.status.red('Error creating ' + type + ' ' + id);
          console.log('Error creating Prelert object:', error);
      }
    });
  }

  _.each(searches, function(obj) {
    plugin.status.yellow('Creating Prelert searches');
    createObject(obj._id, obj._type, obj._source);
  });

  _.each(visualizations, function(obj) {
    plugin.status.yellow('Creating Prelert visualizations');
    createObject(obj._id, obj._type, obj._source);
  });

  _.each(dashboards, function(obj) {
    plugin.status.yellow('Creating Prelert dashboards');
    createObject(obj._id, obj._type, obj._source);
  });
};
