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
 * Performs a number of checks during initialization of the Prelert plugin,
 * such as that Elasticsearch is running, and that the Prelert searches, visualizations
 * and dashboards exist in the Elasticsearch kibana index.
 */

import _ from 'lodash';
import Promise from 'bluebird';
import elasticsearch from 'elasticsearch';
import createDashboardObjects from './create_dashboard_objects';
import util from 'util';

const NoConnections = elasticsearch.errors.NoConnections;
const format = util.format;

module.exports = function (plugin, server) {
  const config = server.config();
  const client = server.plugins.elasticsearch.client;
  const PRELERT_RESULTS_INDEX_ID = 'prelertresults-*';    // Move to config file?
  const PRELERT_INTERNAL_INDEX_ID = 'prelert-int';

  plugin.status.yellow('Waiting for Elasticsearch');

  function waitForPong() {
    return client.ping({ requestTimeout: 1500 }).catch((err) => {
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
    }).then((resp) => {
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
    }).then((resp) => {
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
    }).then((resp) => {
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
          { name: '_index', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_id', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_type', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: '_score', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_source', type: '_source', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '@timestamp', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'processingTimeMs', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'recordCount', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'eventCount', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'isInterim', type: 'boolean', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'initialAnomalyScore', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'maxNormalizedProbability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'jobId', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'anomalyScore', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'probability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'renormalizationWindow', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'resultsRetentionDays', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'finishedTime', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'timeout', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'lastDataTime', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'createTime', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'regex', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'examples', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'terms', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'influencerFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'influencerFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'fieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'initialNormalizedProbability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'byFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'overFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'partitionFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'byFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'function', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'functionDescription', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'detectorIndex', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'overFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'partitionFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'normalizedProbability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'typical', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'actual', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'debugUpper', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'debugLower', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'debugMedian', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'debugFeature', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.function', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.partitionFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'causes.overFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.byFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.probability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.byFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'causes.functionDescription', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.fieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.overFieldValue', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'causes.actual', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.partitionFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'causes.typical', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'influencers.influencerFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'influencers.influencerFieldValues', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'bucketInfluencers.influencerFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'bucketInfluencers.rawAnomalyScore', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'bucketInfluencers.anomalyScore', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'bucketInfluencers.probability', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'bucketInfluencers.influencerFieldName', type: 'string', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'quantiles.quantileState', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: 'quantileState', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false }
        ]),
        // The "Short Dots" format stops large quantiles strings from hanging Chrome
        fieldFormatMap: '{"quantiles.quantileState":{"id":"string","params":{"transform":"short"}},' +
          '"quantileState":{"id":"string","params":{"transform":"short"}}}'
      }
    }, (error, response) => {
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
    }).then((resp) => {
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
          { name: '_index', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_id', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_type', type: 'string', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: true, aggregatable: true },
          { name: '_score', type: 'number', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '_source', type: '_source', count: 0, scripted: false, indexed: false, analyzed: false,
            doc_values: false, searchable: false, aggregatable: false },
          { name: '@timestamp', type: 'date', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: true, aggregatable: true },
          { name: 'jobId', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'level', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: true },
          { name: 'message', type: 'string', count: 0, scripted: false, indexed: true, analyzed: true,
            doc_values: false, searchable: true, aggregatable: false },
          { name: 'totalJobs', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: false, aggregatable: false },
          { name: 'totalDetectors', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: false, aggregatable: false },
          { name: 'runningJobs', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: false, aggregatable: false },
          { name: 'runningDetectors', type: 'number', count: 0, scripted: false, indexed: true, analyzed: false,
            doc_values: true, searchable: false, aggregatable: false }
        ])
      }
    }, (error, response) => {
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
    }).then((response) => {
      if (response) {
        const defaultIndex = _.get(response, '_source.defaultIndex', null);
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
    }, (error, response) => {
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
    }).then((response) => {
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

  let timeoutId = null;

  function scheduleCheck(ms) {
    if (timeoutId) {
      return;
    }

    const myId = setTimeout(() => {
      check().finally(() => {
        if (timeoutId === myId) startorRestartChecking();
      });
    }, ms);

    timeoutId = myId;
  }

  function startorRestartChecking() {
    scheduleCheck(stopChecking() ? 5000 : 1);
  }

  function stopChecking() {
    if (!timeoutId) {
      return false;
    }
    clearTimeout(timeoutId);
    timeoutId = null;
    return true;
  }

  return {
    run: check,
    start: startorRestartChecking,
    stop: stopChecking,
    isRunning: () => { return !!timeoutId; },
  };

};
