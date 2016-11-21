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
 * Performs a number of checks during initialization of the Prelert plugin,
 * such as that Elasticsearch is running, and that the Prelert searches, visualizations
 * and dashboards exist in the Elasticsearch kibana index.
 */

import _ from 'lodash';
import Promise from 'bluebird';
import elasticsearch from 'elasticsearch';
import createDashboardObjects from './create_dashboard_objects';
import util from 'util';

var NoConnections = elasticsearch.errors.NoConnections;
var format = util.format;

module.exports = function (plugin, server) {
  var config = server.config();
  var client = server.plugins.elasticsearch.client;
  var PRELERT_RESULTS_INDEX_ID = 'prelertresults-*';    // Move to config file?
  var PRELERT_INTERNAL_INDEX_ID = 'prelert-int';

  plugin.status.yellow('Waiting for Elasticsearch');

  function waitForPong() {
      return client.ping({ requestTimeout: 1500 }).catch(function (err) {
          if (!(err instanceof NoConnections)) throw err;

          plugin.status.red(format('Unable to connect to Elasticsearch at %s. Retrying in 5 seconds.', config.get('elasticsearch.url')));

          return Promise.delay(5000).then(waitForPong);
    });
  }

  function waitForKibanaIndex() {
      return client.cluster.health({
          timeout: '5s',
          index: config.get('kibana.index'),
          ignore: [408]
      }).then(function (resp) {
          // if "timed_out" === true then Elasticsearch could not find an index
          // matching our filter within 5 seconds.  If status === "red" that
          // means the index was found but the shards are not ready for queries.
          if (!resp || resp.timed_out || resp.status === 'red') {
              plugin.status.red('Kibana index not available... Trying again in 2.5 seconds.');
              return Promise.delay(2500).then(waitForKibanaIndex);
          }
      });
  }

  function waitForKibanaBuildNumDoc() {
      // Waits to check that the config doc that stores the default Kibana index pattern exists.
      // It is created by Kibana on initial start-up.
      return client.exists({
          index: config.get('kibana.index'),
          type: 'config',
          id: config.get('pkg.version')
      }).then(function(resp){
          if (resp !== true) {
              return Promise.delay(1000).then(waitForKibanaBuildNumDoc);
          }
      });
  }

  function checkForPrelertResultsIndexPattern() {
      return client.exists({
          index: config.get('kibana.index'),
          type: 'index-pattern',
          id: PRELERT_RESULTS_INDEX_ID
      }).then(function(resp){
          if (resp !== true) {
              plugin.status.yellow('No prelertresults-* index pattern found - creating index pattern');
              createPrelertResultsIndexPattern();
          }
      });
  }

  function createPrelertResultsIndexPattern() {
      client.create({
          index: config.get('kibana.index'),
          type: 'index-pattern',
          id: PRELERT_RESULTS_INDEX_ID,
          body: {
              title : PRELERT_RESULTS_INDEX_ID,
              timeFieldName: '@timestamp',
              fields: JSON.stringify([
                  { name: '_index', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: '_id', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: '_type', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: '_score', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: '_source', type: '_source', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: '@timestamp', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'processingTimeMs', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'recordCount', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'eventCount', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'isInterim', type: 'boolean', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'initialAnomalyScore', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'maxNormalizedProbability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'jobId', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'anomalyScore', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'probability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'renormalizationWindow', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: 'resultsRetentionDays', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: 'finishedTime', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'timeout', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: 'lastDataTime', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'createTime', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'regex', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: 'examples', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: 'terms', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: 'influencerFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'influencerFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true, doc_values: false },
                  { name: 'fieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'initialNormalizedProbability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'byFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true, doc_values: false },
                  { name: 'overFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'partitionFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'byFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'function', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'functionDescription', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'detectorIndex', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'overFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true, doc_values: false },
                  { name: 'partitionFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true, doc_values: false },
                  { name: 'normalizedProbability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'typical', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'actual', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'debugUpper', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'debugLower', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'debugMedian', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'debugFeature', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'causes.function', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'causes.partitionFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true, doc_values: false },
                  { name: 'causes.overFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'causes.byFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'causes.probability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'causes.byFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true, doc_values: false },
                  { name: 'causes.functionDescription', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'causes.fieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'causes.overFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true, doc_values: false },
                  { name: 'causes.actual', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'causes.partitionFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'causes.typical', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'influencers.influencerFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'influencers.influencerFieldValues', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true, doc_values: false },
                  { name: 'bucketInfluencers.influencerFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'bucketInfluencers.rawAnomalyScore', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'bucketInfluencers.anomalyScore', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'bucketInfluencers.probability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'bucketInfluencers.influencerFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'quantiles.quantileState', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: 'quantileState', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false }
              ]),
              // The "Short Dots" format stops large quantiles strings from hanging Chrome
              fieldFormatMap: '{"quantiles.quantileState":{"id":"string","params":{"transform":"short"}},"quantileState":{"id":"string","params":{"transform":"short"}}}'
          }
        }, function (error, response) {
            if (error) {
                plugin.status.red('Error creating index pattern prelertresults-*');
                console.log('Error creating index pattern prelertresults-*:', error);
          }
        });
  }

  function checkForPrelertInternalIndexPattern() {
      return client.exists({
          index: config.get('kibana.index'),
          type: 'index-pattern',
          id: PRELERT_INTERNAL_INDEX_ID
      }).then(function(resp){
          if (resp !== true) {
              plugin.status.yellow('No prelert-int index pattern found - creating index pattern');
              createPrelertInternalIndexPattern();
          }
      });
  }

  function createPrelertInternalIndexPattern() {
      client.create({
          index: config.get('kibana.index'),
          type: 'index-pattern',
          id: PRELERT_INTERNAL_INDEX_ID,
          body: {
              title : PRELERT_INTERNAL_INDEX_ID,
              timeFieldName: '@timestamp',
              fields: JSON.stringify([
                  { name: '_index', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: '_id', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: '_type', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: '_score', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: '_source', type: '_source', count: 0, scripted: false, indexed: false, analyzed: false, doc_values: false },
                  { name: '@timestamp', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'jobId', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true, doc_values: false },
                  { name: 'level', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true, doc_values: false },
                  { name: 'message', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true, doc_values: false },
                  { name: 'totalJobs', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'totalDetectors', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'runningJobs', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true },
                  { name: 'runningDetectors', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false, doc_values: true }
              ])
          }
        }, function (error, response) {
            if (error) {
                plugin.status.red('Error creating index pattern prelert-int');
                console.log('Error creating index pattern prelert-int:', error);
          }
        });
  }

  function checkForDefaultIndexConfig() {
      // Checks that a default index pattern has been set for the Kibana config,
      // and if not sets it to prelertresults-*.
      return client.get({
          index: config.get('kibana.index'),
          type: 'config',
          id: config.get('pkg.version')
      }).then(function(response){
          if (response) {
              var defaultIndex = _.get(response, '_source.defaultIndex', null);
              if (defaultIndex === null) {
                  setDefaultIndexConfig();
              }
          }
      });
  }

  function setDefaultIndexConfig() {

      client.update({
          index: config.get('kibana.index'),
          type: 'config',
          id: config.get('pkg.version'),
          body: {
              doc: {
                  defaultIndex: PRELERT_RESULTS_INDEX_ID
              }
          }
      }, function (error, response) {
          if (error) {
              // Display message, but leave status as green as Prelrt plugin can still function.
              plugin.status.green('Unable to set default Kibana index pattern to ' + PRELERT_RESULTS_INDEX_ID);
          }
      });
  }

  function checkForDashboardObjects() {
      // Just check if the Summary dashboard exists,
      // and if it does assume all the objects for the Prelert dashboards exist.
      // Otherwise create all the required searches, visualizations, and dashboards.
      return client.exists({
          index: config.get('kibana.index'),
          type: 'dashboard',
          id: 'Summary'
      }).then(function(response){
          if (response === true) {
              // Prelert dashboard Objects are created and ready.
              plugin.status.green('Prelert dashboard objects exist');
              stopChecking();
          } else {
              try {
                  plugin.status.yellow('No Summary dashboard found - creating dashboard objects');
                  createDashboardObjects(server, plugin);
              } catch (err) {
                  plugin.status.red('Error creating dashboard objects');
                  console.log('Error creating Prelert dashboard objects:', err);
              }
          }
      });
  }

  function check() {
    return waitForPong()
    .then(waitForKibanaIndex)
    .then(waitForKibanaBuildNumDoc)
    .then(checkForPrelertResultsIndexPattern)
    .then(checkForPrelertInternalIndexPattern)
    .then(checkForDefaultIndexConfig)
    .then(checkForDashboardObjects)
    .catch(err => plugin.status.red(err));
  }

  var timeoutId = null;

  function scheduleCheck(ms) {
    if (timeoutId) return;

    var myId = setTimeout(function () {
      check().finally(function () {
        if (timeoutId === myId) startorRestartChecking();
      });
    }, ms);

    timeoutId = myId;
  }

  function startorRestartChecking() {
    scheduleCheck(stopChecking() ? 5000 : 1);
  }

  function stopChecking() {
    if (!timeoutId) return false;
    clearTimeout(timeoutId);
    timeoutId = null;
    return true;
  }

  return {
    run: check,
    start: startorRestartChecking,
    stop: stopChecking,
    isRunning: function () { return !!timeoutId; },
  };

};
