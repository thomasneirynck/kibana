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
 * Angular controller for the Prelert Connections map visualization.
 */
import rison from 'rison-node';
import _ from 'lodash';
import $ from 'jquery';
import d3 from 'd3';
import moment from 'moment';
import chrome from 'ui/chrome';
import 'ui/courier';

import 'plugins/prelert/components/paginated_table';
import 'plugins/prelert/filters/abbreviate_whole_number';
import 'plugins/prelert/filters/time_of_week';
import 'plugins/prelert/services/job_service';
import 'plugins/prelert/services/results_service';
import 'plugins/prelert/services/prelert_dashboard_service';
import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import stringUtils from 'plugins/prelert/util/string_utils';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlConnectionsMapController', function($scope, $route, $location, $window, timefilter, courier, prlJobService, prlResultsService, prlDashboardService) {

  $scope.detectorsByJob = {};
  $scope.numberHits = -1;

  $scope.selectedNode = null;
  $scope.selectedLink = null;

  $scope.getSelectedJobIds = function() {
    var selectedJobs = _.filter($scope.vis.params.jobs, function(job){ return job.selected; });
    return _.map(selectedJobs, function(job){return job.id;});
  };

  $scope.setViewBy = function(viewBy) {
    $scope.vis.params.viewBy = viewBy;

    // Updates the 'View by' field stored in the editable vis (i.e. if viewing
    // in the Kibana Visualize tab) before refreshing the data.
    var editableVis = $scope.vis.getEditableVis();
    if (editableVis) {
      var editableVisState = editableVis.getState();
      editableVisState.params.viewBy = $scope.vis.params.viewBy;
      editableVis.setState(editableVisState);
    }

    $scope.refresh();
  };

  $scope.setThreshold = function(threshold) {
    $scope.vis.params.threshold = threshold;

    // Updates the 'View by' field stored in the editable vis (i.e. if viewing
    // in the Kibana Visualize tab) before refreshing the data.
    var editableVis = $scope.vis.getEditableVis();
    if (editableVis) {
      var editableVisState = editableVis.getState();
      editableVisState.params.threshold = $scope.vis.params.threshold;
      editableVis.setState(editableVisState);
    }

    $scope.refresh();
  };

  $scope.initializeVis = function() {
    // Load the job info needed by the visualization, then do the first load.
    prlJobService.getBasicJobInfo($scope.vis.indexPattern.id)
    .then(function(resp) {
      if (resp.jobs.length > 0) {
        // Set any jobs passed in the URL as selected, otherwise check any saved in the Vis.
        var selectedJobIds = [];
        var urlSearch = $location.search();
        if (_.has(urlSearch, 'jobId')) {
          var jobIdParam = urlSearch.jobId;
          if (_.isArray(jobIdParam) == true) {
              selectedJobIds = jobIdParam;
          } else {
              selectedJobIds = [jobIdParam];
          }
        } else {
          selectedJobIds = $scope.getSelectedJobIds();
        }
        var selectAll = ((selectedJobIds.length == 1 && selectedJobIds[0] == '*') || selectedJobIds.length == 0);

        var jobs = [];
        var detectorsByJob = {};
        _.each(resp.jobs, function(job){
          jobs.push({id:job.id, selected: selectAll || (_.indexOf(selectedJobIds, job.id) > -1)});
          detectorsByJob[job.id] = job.detectorDescriptions;
        });

        $scope.vis.params.jobs = jobs;

        // Make the list of jobs available to the editor panel.
        var editableVis = $scope.vis.getEditableVis();
        if (editableVis) {
          var editableVisState = editableVis.getState();
          editableVisState.params.jobs = jobs;
          editableVis.setState(editableVisState);
        }

        $scope.detectorsByJob = anomalyUtils.labelDuplicateDetectorDescriptions(detectorsByJob);

        $scope.refresh();
      }
    }).catch(function(resp) {
      console.log("Connections map - error getting job info from elasticsearch:", resp);
    });
  };

  $scope.refresh = function() {
    $scope.selectedNode = null;
    $scope.selectedLink = null;
    $scope.summaryRecords = {};
    $scope.categoryExamplesByJob = {};

    var bounds = timefilter.getActiveBounds();
    $scope.timeRangeLabel = bounds.min.format('MMMM Do YYYY, HH:mm') + ' to ' + bounds.max.format('MMMM Do YYYY, HH:mm');

    var selectedJobIds = $scope.getSelectedJobIds();
    prlResultsService.getRecordInfluencers($scope.vis.indexPattern.id, selectedJobIds,
        $scope.vis.params.threshold.val, bounds.min.valueOf(), bounds.max.valueOf(), 500)
    .then(function(resp){
      $scope.numberHits = resp.records.length;

      // Find the different influencerFieldNames.
      var influencerFieldNames = [];
      _.each(resp.records, function(record){
        var influencers = _.get(record, 'influencers', []);
        _.each(influencers, function(influencer){
          if (_.indexOf(influencerFieldNames, influencer.influencerFieldName) === -1){
            influencerFieldNames.push(influencer.influencerFieldName);
          }
        });
      });

      var viewByOptions = [{field:'prelert-detector', label:'detector'}];
      _.each(influencerFieldNames, function(influencerFieldName){
        viewByOptions.push({field:influencerFieldName, label:influencerFieldName});
      });
      $scope.vis.type.params.viewByOptions = viewByOptions;

      // Set the selected 'View by' option back to detector if the old
      // selection is not applicable for the new data.
      var selectOption = _.find($scope.vis.type.params.viewByOptions, function(option){
        return option.field == $scope.vis.params.viewBy.field;
      });
      if (selectOption !== undefined) {
        $scope.vis.params.viewBy = selectOption;
      } else {
        $scope.vis.params.viewBy = $scope.vis.type.params.viewByOptions[0];
      }

      if ($scope.vis.params.viewBy.field === 'prelert-detector') {
        processForDetectors(resp.records);
      } else {
        processForInfluencers(resp.records, $scope.vis.params.viewBy.field);
      }

      $scope.$broadcast('render');

    }).catch(function(resp) {
      console.log("Connections map - error getting records from elasticsearch:", resp);
    });

  };

  $scope.showNodeAnomalies = function(node) {

    var bounds = timefilter.getActiveBounds();
    var selectedJobIds = $scope.getSelectedJobIds();

    if (node.fieldName == 'prelert-detector') {
      // Get the corresponding job ID and detector index.
      var selectedJobId = '';
      var selectedDetectorIndex = -1;

      var detectorsForSelectedJobs = _.pick($scope.detectorsByJob, selectedJobIds);
      _.each(detectorsForSelectedJobs, function(detectorDescriptions, jobId){
        var detectorIndex = _.indexOf(detectorDescriptions, node.fieldValue);
        if (detectorIndex >= 0) {
          selectedJobId = jobId;
          selectedDetectorIndex = detectorIndex;
        }
      });

      prlResultsService.getRecordsForDetector($scope.vis.indexPattern.id, selectedJobId, selectedDetectorIndex, true, null, null,
          $scope.vis.params.threshold.val, bounds.min.valueOf(), bounds.max.valueOf(), 500)
      .then(function(resp){
        setSummaryTableRecords(resp.records, 'entity');
      });

    } else {
      prlResultsService.getRecordsForInfluencer($scope.vis.indexPattern.id, selectedJobIds, [node],
          $scope.vis.params.threshold.val, bounds.min.valueOf(), bounds.max.valueOf(), 500)
      .then(function(resp){
        setSummaryTableRecords(resp.records, 'detector');
      });
    }
  };

  $scope.showLinkAnomalies = function(link) {

    var bounds = timefilter.getActiveBounds();
    var selectedJobIds = $scope.getSelectedJobIds();

    var detectorNode = link.inner.fieldName == 'prelert-detector' ? link.inner :
      (link.outer.fieldName == 'prelert-detector' ? link.outer : null);
    var influencer1 = link.inner.fieldName != 'prelert-detector' ? link.inner :
      (link.outer.fieldName != 'prelert-detector' ? link.outer : null);

    if (detectorNode !== null) {
      // Get the corresponding job ID and detector index.
      var selectedJobId = '';
      var selectedDetectorIndex = -1;

      var detectorsForSelectedJobs = _.pick($scope.detectorsByJob, selectedJobIds);
      _.each(detectorsForSelectedJobs, function(detectorDescriptions, jobId){
        var detectorIndex = _.indexOf(detectorDescriptions, detectorNode.fieldValue);
        if (detectorIndex >= 0) {
          selectedJobId = jobId;
          selectedDetectorIndex = detectorIndex;
        }
      });

      link.detector = detectorNode.fieldValue;
      link.influencer1FieldName = influencer1.fieldName;
      link.influencer1FieldValue = influencer1.fieldValue;
      prlResultsService.getRecordsForDetector($scope.vis.indexPattern.id, selectedJobId, selectedDetectorIndex,
          true, influencer1.fieldName, influencer1.fieldValue,
          $scope.vis.params.threshold.val, bounds.min.valueOf(), bounds.max.valueOf(), 500)
      .then(function(resp){
        setSummaryTableRecords(resp.records, 'detector');
      });
    } else {
      link.influencer1FieldName = influencer1.fieldName;
      link.influencer1FieldValue = influencer1.fieldValue;
      link.influencer2FieldName = link.outer.fieldName;
      link.influencer2FieldValue = link.outer.fieldValue;

      prlResultsService.getRecordsForInfluencer($scope.vis.indexPattern.id, selectedJobIds, [link.inner, link.outer],
          $scope.vis.params.threshold.val, bounds.min.valueOf(), bounds.max.valueOf(), 500)
      .then(function(resp){
        setSummaryTableRecords(resp.records, 'detector');
      });
    }

  };

  $scope.getExamplesForCategory = function(jobId, categoryId) {
    return _.get($scope.categoryExamplesByJob, [jobId, categoryId], []);
  };

  $scope.viewInExplorer = function(nodes) {
    // Open the Explorer dashboard to show results for specified node(s).
    var bounds = timefilter.getActiveBounds();
    var from = bounds.min.toISOString();    // e.g. 2016-02-08T16:00:00.000Z
    var to = bounds.max.toISOString();

    // Build the query to pass to the Explorer dashboard.
    var query = '*';
    if (nodes.length > 0) {
      query = '';
      _.each(nodes, function(node, i){
        if (node.fieldName != 'prelert-detector') {
          if (query.length > 0 && i > 0) {
            query += " AND ";
          }

          var escapedFieldName = stringUtils.escapeForElasticsearchQuery(node.fieldName);
          var escapedFieldValue = stringUtils.escapeForElasticsearchQuery(node.fieldValue);
          query += escapedFieldName + ':' + escapedFieldValue;
        }
      });

      // use rison's url encoder because it escapes quote characters correctly
      query = rison.encode_uri(query);
    }

    var path = chrome.getBasePath() + "/app/prelert#/anomalyexplorer?_g=(refreshInterval:(display:Off,pause:!f,value:0)," +
      "time:(from:'" + from + "',mode:absolute,to:'" + to + "'))" +
      "&_a=(filters:!(),query:(query_string:(analyze_wildcard:!t,query:" + query + ")))";

    // Pass the selected job(s) and threshold as search parameters in the URL.
    path += "&minSeverity="+$scope.vis.params.threshold.display;
    var selectedJobIds = $scope.getSelectedJobIds();
    var allSelected = ((selectedJobIds.length == 1 && selectedJobIds[0] == '*') || selectedJobIds.length == 0);
    if (!allSelected) {
      _.each(selectedJobIds, function(jobId) {
        path += "&jobId=";
        path += jobId;
      });
    }

    $window.open(path, '_blank');
  };

  // Refresh the data when the time range is altered.
  $scope.$listen(timefilter, 'fetch', $scope.refresh);

  // When inside a dashboard in the Prelert plugin, listen for changes to job selection.
  prlDashboardService.listenJobSelectionChange($scope, function(event, selections){
    var selectAll = ((selections.length == 1 && selections[0] == '*') || selections.length == 0);
    _.each($scope.vis.params.jobs, function(job){
      job.selected = (selectAll || _.indexOf(selections, job.id) != -1);
    });

    $scope.refresh();

  });

  // Extend Vis setState so that we can refresh the data when the visualization
  // params (threshold, job IDs) are altered in the Kibana Visualize tab.
  var savedVis = $route.current.locals.savedVis;
  if (savedVis !== undefined) {
    var vis = savedVis.vis;
    var visSetState = vis.setState;
    vis.setState = function() {
      visSetState.apply(this, arguments);
      $scope.refresh();
    };
  }

  // Retrieve the index pattern for a saved vis, or load the default for a new vis.
  if ($scope.vis.indexPattern) {
    $scope.initializeVis();
  } else {
    // TODO - move the default index pattern into an editor setting?
    courier.indexPatterns.get('prelertresults-*')
    .then(function(indexPattern){
      $scope.vis.indexPattern = indexPattern;
      $scope.initializeVis();
    }).catch(function(resp) {
      console.log("Connections map - error loading prelertresults-* index pattern:", resp);
    });
  }


  function processForDetectors(records) {
    // Produce an object in the following form:
    //    var dataset = {
    //        'Unusual bytes': [ {field: 'uri', value: 'login.php', score: 75, scoreForAllValues: 120}, {..} ] ,
    //        'Freq rare URI': [ {field: 'status', value: 404, score: 95, scoreForAllValues: 95}, {..} ],
    //        'High count URI': [ {field: 'uri', value: 'login.php', score: 75, scoreForAllValues: 174}, {..}]
    //    };
    // where score = sum(normalizedProbability) of records with
    //    (influencer/detector name, influencer/detector value, influencer) triple
    // and scoreForAllValues = sum(normalizedProbability) of records with (influencer/detector name, influencer) pair
    // These are used to calculate the 'strength' of the connection.

    console.log("Connections map processForDetectors() passed:", records);

    var dataset = {};
    $scope.maxNormProbByField = {'prelert-detector':{}};

    _.each(records, function(record){
      var detectorDesc = $scope.detectorsByJob[record.jobId][record.detectorIndex];
      var maxNormProbByDetector = $scope.maxNormProbByField['prelert-detector'];
      maxNormProbByDetector[detectorDesc] =
        Math.max(_.get(maxNormProbByDetector, detectorDesc, 0), record.normalizedProbability);
      var key = detectorDesc;
      var connections = [];
      if (_.has(dataset, key)) {
        connections = dataset[key];
      } else {
        dataset[key] = connections;
      }

      var influencers = record.influencers;
      _.each(influencers, function(influencer){
        var fieldName = influencer.influencerFieldName;
        _.each(influencer.influencerFieldValues, function(fieldValue){

          var connection = _.findWhere(connections, {field: fieldName, value:fieldValue});
          if (connection === undefined) {
            connections.push({
              field: fieldName,
              value: fieldValue,
              score: record.normalizedProbability
            });
          } else {
            connection.score = connection.score+record.normalizedProbability;
          }

          var maxNormProbByFieldName = ($scope.maxNormProbByField[fieldName] || {});
          maxNormProbByFieldName[fieldValue] = Math.max(_.get(maxNormProbByFieldName, fieldValue, 0), record.normalizedProbability);
          $scope.maxNormProbByField[fieldName] = maxNormProbByFieldName;
        });
      });
    });

    var scoresForDetectorAndFieldName = [];
    _.each(dataset, function(connections, key){

      _.each(connections, function(connection){
        var detectorFieldNameList = _.where(connections, {field: connection.field});
        connection.scoreForAllValues = _.reduce(detectorFieldNameList, function(memo, connection){ return memo + connection.score; }, 0);
      });
    });

    console.log("processForDetectors() built dataset:", dataset);

    $scope.chartData = dataset;
  }


  function processForInfluencers(records, influencerFieldName) {
    // Produce an object in the following form:
    //    var dataset = {
    //        200: [ {field: 'uri', value: 'login.php', score: 75, scoreForAllValues: 120}, {..} ] ,
    //        301: [ {field: 'prelert-detector', value: 'Freq rare URI', score: 95, scoreForAllValues: 95}, {..} ],
    //        404: [ {field: 'uri', value: 'login.php', score: 75, scoreForAllValues: 174}, {..}]
    //    };
    // where score = sum(normalizedProbability) of records with
    //    (influencer/detector name, influencer/detector value, influencer) triple
    // and scoreForAllValues = sum(normalizedProbability) of records with (influencer/detector name, influencer) pair
    // These are used to calculate the 'strength' of the connection.

    console.log("Connections map processForInfluencers() passed:", records);

    var dataset = {};
    $scope.maxNormProbByField = {'prelert-detector':{}};

    _.each(records, function(record){
      var influencers = record.influencers;

      var dataForFieldName = _.find(influencers, function(influencer){
        return influencer.influencerFieldName === influencerFieldName;
      });

      if (dataForFieldName !== undefined) {
        // Filter influencers for those not for the specified influencerFieldName.
        var dataForOtherFieldNames = _.filter(influencers, function(influencer){
          return influencer.influencerFieldName !== influencerFieldName;
        });

        var influencerFieldValues = dataForFieldName.influencerFieldValues;
        _.each(influencerFieldValues, function(fieldValue){
          var key = fieldValue;
          var connections = [];
          if (_.has(dataset, key)) {
            connections = dataset[key];
          } else {
            dataset[key] = connections;
          }

          var maxNormProbByFieldName = ($scope.maxNormProbByField[influencerFieldName] || {});
          maxNormProbByFieldName[fieldValue] = Math.max(_.get(maxNormProbByFieldName, fieldValue, 0), record.normalizedProbability);
          $scope.maxNormProbByField[influencerFieldName] = maxNormProbByFieldName;

          _.each(dataForOtherFieldNames, function(influencer){
            _.each(influencer.influencerFieldValues, function(fieldValue){
              var fieldName = influencer.influencerFieldName;
              var connection = _.findWhere(connections, {field: fieldName, value:fieldValue});
              if (connection === undefined) {
                connections.push({
                  field: fieldName,
                  value: fieldValue,
                  score: record.normalizedProbability
                });
              } else {
                connection.score = connection.score+record.normalizedProbability;
              }

              maxNormProbByFieldName = ($scope.maxNormProbByField[fieldName] || {});
              maxNormProbByFieldName[fieldValue] = Math.max(_.get(maxNormProbByFieldName, fieldValue, 0), record.normalizedProbability);
              $scope.maxNormProbByField[fieldName] = maxNormProbByFieldName;
            });
          });

          // Add connection for the detector.
          var detectorDesc = $scope.detectorsByJob[record.jobId][record.detectorIndex];
          var detectorConnection = _.findWhere(connections, {field: 'prelert-detector', value:detectorDesc});
          if (detectorConnection === undefined) {
            connections.push({
              field: 'prelert-detector',
              value: detectorDesc,
              score: record.normalizedProbability
            });
          } else {
            detectorConnection.score = detectorConnection.score+record.normalizedProbability;
          }

          var maxNormProbByDetector = $scope.maxNormProbByField['prelert-detector'];
          maxNormProbByDetector[detectorDesc] =
            Math.max(_.get(maxNormProbByDetector, detectorDesc, 0), record.normalizedProbability);
        });
      }
    });

    var scoresForInfluencerAndFieldName = [];
    _.each(dataset, function(connections, key){

      _.each(connections, function(connection){
        var forFieldNameList = _.where(connections, {field: connection.field});
        connection.scoreForAllValues = _.reduce(forFieldNameList, function(memo, connection){ return memo + connection.score; }, 0);
      });
    });

    console.log("processForInfluencers() built dataset:", dataset);

    $scope.chartData = dataset;
  }

  // Aggregates by 'entity' or 'detector', to show a summary of anomalies for the selected
  // node or link, including details of the record with the maximum normalized probability.
  function setSummaryTableRecords(records, aggregateBy) {
    var summaryRecords = [];
    var categoryIdsByJobId = {};

    _.each(records, function(record){
      var jobId = record['jobId'];
      var detectorIndex = record['detectorIndex'];
      var detectorDesc = $scope.detectorsByJob[record.jobId][record.detectorIndex];
      var entityFieldName = anomalyUtils.getEntityFieldName(record);
      var entityFieldValue = anomalyUtils.getEntityFieldValue(record);

      var summary = (aggregateBy === 'entity' && entityFieldName !== undefined) ?
          _.findWhere(summaryRecords, {'entityFieldName':entityFieldName, 'entityFieldValue':entityFieldValue}) :
            _.findWhere(summaryRecords, {'detectorDescription':detectorDesc});
      if (summary === undefined) {
        summary = {
            'detectorDescription':detectorDesc,
            'entityFieldName': entityFieldName,
            'entityFieldValue':entityFieldValue,
            'count': 1,
            'sumScore': record.normalizedProbability,
            'maxScoreRecord': record
            };
        summaryRecords.push(summary);
      } else {
        summary.count = summary.count+1;
        summary.sumScore = summary.sumScore + record.normalizedProbability;
        if (record.normalizedProbability > summary.maxScoreRecord.normalizedProbability) {
          summary.maxScoreRecord = record;
          summary.entityFieldName = anomalyUtils.getEntityFieldName(record);
          summary.entityFieldValue = anomalyUtils.getEntityFieldValue(record);
        }
      }
    });

    // Only show top 5 by max normalized probability.
    summaryRecords = _.take(summaryRecords, 5);

    var compiledTooltip = _.template('<div class="prl-connections-map-score-tooltip">maximum score: <%= maxScoreValue %>'+
        '<hr/>total score: <%= totalScoreValue %></div>');
    _.each(summaryRecords, function(summary){
      // Calculate scores used in the summary visual.
      var maxScoreRecord = summary.maxScoreRecord;
      var maxScore = parseInt(maxScoreRecord.normalizedProbability);
      var totalScore = parseInt(summary.sumScore);
      var barScore = maxScore != 0 ? maxScore: 1;
      var maxScoreLabel = maxScore != 0 ? maxScore: '< 1';
      var totalScoreLabel = totalScore != 0 ? totalScore: '< 1';

      summary.barScore = barScore;
      summary.maxScoreLabel = maxScoreLabel;
      summary.totalScore = totalScore,
      summary.severity = anomalyUtils.getSeverity(maxScoreRecord.normalizedProbability);
      summary.tooltip = compiledTooltip({
        'maxScoreValue':maxScoreLabel,
        'totalScoreValue':totalScoreLabel
      });

      var stringTime = maxScoreRecord[$scope.vis.indexPattern.timeFieldName];
      summary.anomalyTime = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).format('MMM Do YYYY, HH:mm:ss');

      // Store metric information.
      var functionDescription = _.get(maxScoreRecord, 'functionDescription', '');
      if (anomalyUtils.showMetricsForFunction(functionDescription) === true) {
        if (!_.has(maxScoreRecord, 'causes')) {
          summary.actual = maxScoreRecord.actual;
          summary.typical = maxScoreRecord.typical;
        } else {
          var causes = maxScoreRecord.causes;
          if (causes.length == 1) {
            // If only one 'cause', move values to top level.
            var cause = _.first(causes);
            summary.actual = cause.actual;
            summary.typical = cause.typical;
           }
        }
      }

      if (_.has(maxScoreRecord, 'prelertcategory')) {
          if (!_.has(categoryIdsByJobId, maxScoreRecord.jobId)) {
            categoryIdsByJobId[maxScoreRecord.jobId] = [];
          }
          categoryIdsByJobId[maxScoreRecord.jobId].push(maxScoreRecord.prelertcategory);
      }

      // Store causes information for analyses with by and over fields.
      if (_.has(maxScoreRecord, 'causes')) {
        var causes = maxScoreRecord.causes;
        // TODO - when multivariate supported for population analyses, look in each cause
        //    for a 'correlatedByFieldValue' field, and if so, add to causes scope object.
        if (causes.length === 1) {
          // Metrics will already have been placed at the top level.
          // If cause has byFieldValue, move it to a top level fields for display.
          var cause = _.first(causes);
          if (_.has(cause, 'byFieldName')) {
            summary.singleCauseByFieldName = cause.byFieldName;
            summary.singleCauseByFieldValue = cause.byFieldValue;
          }
        } else {
          summary.causes = _.map(causes, function(cause){
            // Get the 'entity field name/value' to display in the cause -
            // For by and over, use byFieldName/Value (overFieldName/Value are in the top level fields)
            // For just an 'over' field - the overFieldName/Value appear in both top level and cause.
            var simplified = {
                entityName: (_.has(cause, 'byFieldName') ? cause.byFieldName : cause.overFieldName),
                entityValue: (_.has(cause, 'byFieldValue') ? cause.byFieldValue : cause.overFieldValue)
            }
            if (anomalyUtils.showMetricsForFunction(functionDescription) === true) {
              simplified.typical = cause.typical;
              simplified.actual = cause.actual;
            }
            return simplified;
          });
        }

     }
    });

    if (!_.isEmpty(categoryIdsByJobId)) {
      // Load examples for any prelertcategory anomalies.
      $scope.categoryExamplesByJob = {};
      _.each(categoryIdsByJobId, function(categoryIds, jobId) {
        prlResultsService.getCategoryExamples($scope.vis.indexPattern.id, jobId, categoryIds, 10)
        .then(function(resp) {
          $scope.categoryExamplesByJob[jobId] = resp.examplesByCategoryId;
        }).catch(function(resp) {
          console.log("Connections map - error getting category examples from Elasticsearch:", resp);
        });
      });
    }

    $scope.summaryRecords = summaryRecords;
  }
});
