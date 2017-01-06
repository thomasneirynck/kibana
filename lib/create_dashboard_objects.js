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
  const { callWithInternalUser } = server.plugins.elasticsearch.getCluster('admin');
  const index = server.config().get('kibana.index');

  function createObject(id, type, source) {
    callWithInternalUser('create', {
      index: index,
      type: type,
      id: id,
      body: source
    }, (error) => {
      if (error) {
        plugin.status.red('Error creating ' + type + ' ' + id);
        console.log('Error creating Prelert object:', error);
      }
    });
  }

  _.each(searches, (obj) => {
    plugin.status.yellow('Creating Prelert searches');
    createObject(obj._id, obj._type, obj._source);
  });

  _.each(visualizations, (obj) => {
    plugin.status.yellow('Creating Prelert visualizations');
    createObject(obj._id, obj._type, obj._source);
  });

  _.each(dashboards, (obj) => {
    plugin.status.yellow('Creating Prelert dashboards');
    createObject(obj._id, obj._type, obj._source);
  });
};
