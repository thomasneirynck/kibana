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
 * Angular controller for the Prelert anomaly summary table visualization.
 */
import _  from 'lodash';
import $ from 'jquery'; 
import moment from 'moment';

import 'plugins/prelert/filters/time_of_week';
import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import stringUtils from 'plugins/prelert/util/string_utils';
import getSort from 'ui/doc_table/lib/get_sort';
import openRowArrow from 'ui/doc_table/components/table_row/open.html';
import linkControlsHtml from './anomalysummarytable_links.html';
import FilterManagerProvider from 'ui/filter_manager';

import 'ui/doc_table/doc_table.less';
import 'plugins/prelert/components/paginated_table';
import './expanded_row/expanded_row_directive';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlAnomalySummaryTableController', function($scope, $window, $location, savedSearches, Notifier, Private, prlJobService, prlResultsService) {

    // Obtain the mappings for detector descriptions by jobId/detector index.
    $scope.detectorsByJob = {};
    $scope.customUrlsByJob = {};
    prlJobService.getBasicJobInfo($scope.vis.indexPattern.id)
        .then(function(resp) {
            console.log("Anomaly Summary Table getBasicJobInfo jobs :", resp.jobs);
            // Build mappings of jobIds against detector descriptions.
            var detectorsByJob = {};
            var customUrlsByJob = {};
            _.each(resp.jobs, function(job){
                detectorsByJob[job.id] = job.detectorDescriptions;
                if (_.has(job, 'customUrls') && job.customUrls.length > 0){
                    customUrlsByJob[job.id] = job.customUrls;
                }
            });
            
            $scope.detectorsByJob = anomalyUtils.labelDuplicateDetectorDescriptions(detectorsByJob);
            $scope.customUrlsByJob = customUrlsByJob;
            console.log("Anomaly Summary Table detectorsByJob :", detectorsByJob);
            console.log("Anomaly Summary Table customUrlsByJob :", customUrlsByJob);
        }).catch(function(resp) {
            console.log("Anomaly Summary Table - error getting job info from ES:", resp);
        }); 
    
    var momentInterval = 'day';
    var MAX_NUMBER_CATEGORY_EXAMPLES = 10;  // Max number of examples to show in table cell or expanded row (API default is to store 4).

    $scope.hits = [];
    $scope.table = {};
    $scope.table.perPage = 25;
    $scope.table.columns = [];
    $scope.categoryExamplesByJob = {};
    
    if (_.has($location.search(), 'minSeverity')) {
        var threshold = _.findWhere($scope.vis.type.params.thresholdOptions, {display: $location.search().minSeverity});
        if (threshold !== undefined) {
            $scope.vis.params.threshold = threshold;
        } 
    }
    
    var rowScopes = []; // track row scopes, so they can be destroyed as needed
    
    const filterManager = Private(FilterManagerProvider);
    const notify = new Notifier();
    
    // Pattern copied from Kibana ui/public/visualize/visualize.js
    // we need to wait for some watchers to fire at least once
    // before we are "ready", this manages that
    var prereq = (function () {
        var fns = [];

        return function register(fn) {
          fns.push(fn);

          return function () {
            fn.apply(this, arguments);

            if (fns.length) {
              _.pull(fns, fn);
              if (!fns.length) {
                  $scope.$root.$broadcast('ready:vis');
              }
            }
          };
        };
    }());
    
    
    // Obtain the 'Prelert Anomaly Records' saved search to run this visualization off.
    // TODO find a way of using the search source used by the visualization
    //      and setting the searchSource size so we can the actual documents hits and
    //      not just the hit count and aggregations object. Without manually setting the
    //      searchSource size here, the standard response mechanism does not return the hits.
    var savedSearch = savedSearches.get('Anomaly-records').then(prereq(function(savedSearch) {
        var searchSource = savedSearch.searchSource; 
        $scope.indexPattern = searchSource.get('index');
        
        // Ask for top 500 sorted by normalizedProbability.
        // TODO - allow sample size to be configurable in visualization options.
        searchSource.size(500);
        searchSource.sort(getSort(['normalizedProbability', 'desc'], $scope.indexPattern));
        
        $scope.searchSource = searchSource;

        // Set the watcher after initialization
        $scope.$watchCollection('sorting', function (newSort, oldSort) {
            // Don't react if sort values didn't really change
            if (newSort === oldSort) {
                return;
            }
            $scope.searchSource.sort(getSort(newSort, $scope.indexPattern));
            $scope.searchSource.fetchQueued();
        });
        
        $scope.$on('$destroy', function () {
            if ($scope.searchSource) $scope.searchSource.destroy();
            
            _.invoke(rowScopes, '$destroy');
            rowScopes.length = 0;
        });
        
        searchSource.onResults().then(function onResults(resp) {            
            console.log("Anomaly Summary table searchSource.onResults(), hits:", resp.hits.hits);

            // Sort by time before storing in scope.
            var timeFieldName = $scope.indexPattern.timeFieldName;
            var hits = _.sortBy(resp.hits.hits, function(hit) { return hit._source[timeFieldName]; });
            $scope.hits = hits;

            $scope.updateTableData();

            return $scope.searchSource.onResults().then(onResults);
            
        }).catch(notify.fatal);

        $scope.searchSource.onError(notify.error).catch(notify.fatal);
        
    }, function(err) {
        console.log("Anomaly Summary table - error loading Anomaly-records saved search",err); 
    }));
    
    $scope.setThreshold = function(threshold) {
        $scope.vis.params.threshold = threshold;
        $scope.updateTableData();
    };
    
    $scope.setInterval = function(interval) {
        $scope.vis.params.interval = interval;
        var editableVis = $scope.vis.getEditableVis();
        if (editableVis) {
            editableVis.params.interval = interval;
        }
        $scope.updateTableData();
    };
    
    $scope.updateTableData = function() {
        // Aggregate the anomaly data by time and detector, and entity (by/over).
        var summaryRecords = [];
        if ($scope.isShowingAggregatedData()) {
            summaryRecords = $scope.aggregateAnomalies();
        } else {
            // Show every record.
            momentInterval = $scope.vis.params.interval.val;
            var filteredHits = _.filter($scope.hits, function(hit){
                return Number(hit._source.normalizedProbability) >= $scope.vis.params.threshold.val; 
            });
            var timeFieldName = $scope.indexPattern.timeFieldName;
            _.each(filteredHits, function(hit){
                var source = hit._source;
                var stringTime = source[timeFieldName];
                var detectorIndex = source['detectorIndex'];
                var jobId = source['jobId'];
                var detector = source['functionDescription'];
                if ( (_.has($scope.detectorsByJob, jobId)) && (detectorIndex < $scope.detectorsByJob[jobId].length) ){
                    detector = $scope.detectorsByJob[jobId][detectorIndex];
                }
                
                var record = {
                        'time': moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).unix(),
                        'max severity': source.normalizedProbability,
                        'detector': detector,
                        'jobId': source.jobId,
                        'source': source
                }
                
                var entityName = anomalyUtils.getEntityFieldName(source);
                if (entityName !== undefined) {
                    record['entityName'] = entityName;
                    record['entityValue'] = anomalyUtils.getEntityFieldValue(source);
                }
               
                if (_.has(source, 'partitionFieldName')) {
                    record['partitionFieldName'] = source.partitionFieldName;
                    record['partitionFieldValue'] = source.partitionFieldValue;
                }
                
                if (_.has(source, 'influencers')) {
                    var influencers = [];
                    var sourceInfluencers = _.sortBy(source.influencers, 'influencerFieldName');
                    _.each(sourceInfluencers, function(influencer){
                        var influencerFieldName = influencer.influencerFieldName;
                        _.each(influencer.influencerFieldValues, function(influencerFieldValue){
                            var influencerToAdd = {};
                            influencerToAdd[influencerFieldName] = influencerFieldValue;
                            influencers.push(influencerToAdd);
                        });
                    });
                    record['influencers'] = influencers;
                }
                var functionDescription = _.get(source, 'functionDescription', '');
                if (anomalyUtils.showMetricsForFunction(functionDescription) === true) {
                    if (_.has(source, 'actual')) {
                        record['actual'] = source.actual;
                        record['typical'] = source.typical;
                    } else {
                        // If only a single cause, copy values to the top level.
                        if (_.get(source, 'causes', []).length === 1) {
                            var cause = _.first(source.causes);
                            record['actual'] = cause.actual;
                            record['typical'] = cause.typical;
                        }
                    }
                }
                
                if (_.has($scope.customUrlsByJob, source.jobId)) {
                    record['links'] = $scope.customUrlsByJob[source.jobId];
                }
               
                summaryRecords.push(record);
               
            });
        }
        
        _.invoke(rowScopes, '$destroy');
        rowScopes.length = 0;
        
        
        var showExamples = _.some(summaryRecords, {'entityName': 'prelertcategory'});
        if (showExamples) {
            // Obtain the list of categoryIds by jobId for which we need to obtain the examples.
            // Note category examples will not be displayed if prelertcategory is used just an
            // influencer or as a partition field in a config with other by/over fields.
            var categoryRecords = _.where(summaryRecords, {entityName: 'prelertcategory'});
            var categoryIdsByJobId = {};
            _.each(categoryRecords, function(record){
                 if (!_.has(categoryIdsByJobId, record.jobId)) {
                      categoryIdsByJobId[record.jobId] = [];
                 }
                 categoryIdsByJobId[record.jobId].push(record.entityValue);
            });
            loadCategoryExamples(categoryIdsByJobId);
        } else {
          $scope.categoryExamplesByJob = {};
        }
        
        // Only show columns in the table which exist in the results.
        $scope.table.columns = getPaginatedTableColumns(summaryRecords);
      
        $scope.table.rows = summaryRecords.map(function(record) {
            return createTableRow(record);
        });
    };
    
  
    $scope.aggregateAnomalies = function() {
      // Aggregate the anomaly data by time, detector, and entity (by/over/partition).
      // TODO - do we want to aggregate by job too, in cases where different jobs
      // have detectors with the same description.
      console.log("aggregateAnomalies(): number of anomalies to aggregate:", $scope.hits.length);
      
      if (!$scope.hits || $scope.hits.length === 0) {
          return [];
      }
      
      // Determine the aggregation interval.
      var timeFieldName = $scope.indexPattern.timeFieldName;
      if ($scope.vis.params.interval.val === 'auto') {
          var earliest = moment(_.first($scope.hits)._source[timeFieldName], 'YYYY-MM-DDTHH:mm:ss.SSSZ', true);
          var latest = moment(_.last($scope.hits)._source[timeFieldName], 'YYYY-MM-DDTHH:mm:ss.SSSZ', true);
          var daysDiff = latest.diff(earliest, 'days');
          momentInterval = (daysDiff < 2 ? 'hour' : 'day');
      } else {
          momentInterval = $scope.vis.params.interval.val;
      }
      
      // Only show records passing the severity threshold.
      var filteredHits = _.filter($scope.hits, function(hit){
          return Number(hit._source.normalizedProbability) >= $scope.vis.params.threshold.val; 
      });
      
      var aggregatedData = {};
      _.each(filteredHits, function(hit){
          var source = hit._source;
          var stringTime = source[timeFieldName];
          
          // Use moment.js to get start of interval. This will use browser timezone.
          // TODO - check if Kibana has functionality for displaying times in
          // browser or UTC timezone.
          var roundedTime = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).startOf(momentInterval).unix();                 
          if (!_.has(aggregatedData, roundedTime)){
              aggregatedData[roundedTime] = {}; 
          }
          
          // Aggregate by detector - default to functionDescription if no description available.
          var detectorIndex = source['detectorIndex'];
          var jobId = source['jobId'];
          var detector = source['functionDescription'];
          if ( (_.has($scope.detectorsByJob, jobId)) && (detectorIndex < $scope.detectorsByJob[jobId].length) ){
              detector = $scope.detectorsByJob[jobId][detectorIndex];
          }
          var detectorsAtTime = aggregatedData[roundedTime];
          if (!_.has(detectorsAtTime, detector)){
              detectorsAtTime[detector] = {};
          }
          
          // Now add an object for the anomaly with the highest anomaly score per entity.
          // For the choice of entity, look in order for byField, overField, partitionField.
          // If no by/over/partition, default to an empty String.
          var entitiesForDetector = detectorsAtTime[detector];
          
          // TODO - are we worried about different byFields having the same
          // value e.g. host=server1 and machine=server1?
          var entity = anomalyUtils.getEntityFieldValue(source);
          if (entity === undefined) {
            entity = "";
          }
          if (!_.has(entitiesForDetector, entity)){
              entitiesForDetector[entity] = source;
          } else {
              var score = source.normalizedProbability;
              if (score > entitiesForDetector[entity].normalizedProbability) {
                  entitiesForDetector[entity] = source;
              }
          }         
      });
      
      console.log("aggregateAnomalies() aggregatedData is:", aggregatedData);
      
      // Flatten the aggregatedData to give a list of records with the highest score per bucketed time / detector.
      var summaryRecords = [];
      _.each(aggregatedData, function(timeDetectors, roundedTime){
          _.each(timeDetectors, function(entityDetectors, detector){
              _.each(entityDetectors, function(source, entity){
                  var record = {
                          'time': roundedTime,
                          'max severity': source.normalizedProbability,
                          'detector': detector,
                          'jobId': source.jobId,
                          'source': source
                  }
                  
                  var entityName = anomalyUtils.getEntityFieldName(source);
                  if (entityName !== undefined) {
                      record['entityName'] = entityName;
                      record['entityValue'] = entity;
                  }
                 
                  if (_.has(source, 'partitionFieldName')) {
                      record['partitionFieldName'] = source.partitionFieldName;
                      record['partitionFieldValue'] = source.partitionFieldValue;
                  }
                  
                  if (_.has(source, 'influencers')) {
                      var influencers = [];
                      var sourceInfluencers = _.sortBy(source.influencers, 'influencerFieldName');
                      _.each(sourceInfluencers, function(influencer){
                          var influencerFieldName = influencer.influencerFieldName;
                          _.each(influencer.influencerFieldValues, function(influencerFieldValue){
                              var influencerToAdd = {};
                              influencerToAdd[influencerFieldName] = influencerFieldValue;
                              influencers.push(influencerToAdd);
                          });
                      });
                      record['influencers'] = influencers;
                  }
                  
                  // Copy actual and typical values to the top level for display.
                  var functionDescription = _.get(record, 'source.functionDescription', '');
                  if (anomalyUtils.showMetricsForFunction(functionDescription) === true) {
                      if (_.has(source, 'actual')) {
                          record['actual'] = source.actual;
                          record['typical'] = source.typical;
                      } else {
                          // If only a single cause, copy values to the top level.
                          if (_.get(source, 'causes', []).length === 1) {
                              var cause = _.first(source.causes);
                              record['actual'] = cause.actual;
                              record['typical'] = cause.typical;
                          }
                      }
                  }
                  
                  
                  // TODO - do we always want the links column visible even when no customUrls have been defined?
                  if (_.has($scope.customUrlsByJob, source.jobId)) {
                      record['links'] = $scope.customUrlsByJob[source.jobId];
                  }
                 
                  summaryRecords.push(record);
                 
              });
          });
      });
      summaryRecords = (_.sortBy(summaryRecords, 'time')).reverse();
      console.log("aggregateAnomalies() returning list of summary records:", summaryRecords.length);
      return summaryRecords;

  };
  
  $scope.isShowingAggregatedData = function() {
      return ($scope.vis.params.interval.display !== 'Show all');
  };

  // Provide a filter function so filters can be added from expanded table rows.
  $scope.filter = function (field, value, operator) {
      filterManager.add(field, value, operator, $scope.indexPattern.id);
  };
  
  $scope.openLink = function(link, source) {
      console.log("Anomaly Summary Table - open link for source:", link, source);
 
      // If urlValue contains $earliest$ and $latest$ tokens, add in times to the source record.
      var timeFieldName = $scope.indexPattern.timeFieldName;
      var stringTime = source[timeFieldName];
      var configuredUrlValue = link.urlValue;
      if (configuredUrlValue.includes("$earliest$")) {
          var roundedMoment = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).startOf(momentInterval);
          if (momentInterval === 'hour') {
              // Start from the previous hour.
              roundedMoment.subtract(1, 'h');
          }
          source.earliest = roundedMoment.toISOString();    // e.g. 2016-02-08T16:00:00.000Z
      }
      
      if (configuredUrlValue.includes("$latest$")) {
          if ($scope.isShowingAggregatedData()) {
              var roundedMoment = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).endOf(momentInterval);
              if (momentInterval === 'hour') {
                  // Show to the end of the next hour.
                  roundedMoment.add(1, 'h');
              } 
              source.latest = roundedMoment.toISOString();      // e.g. 2016-02-08T18:59:59.999Z
          } else {
              // Show the time span of the selected record's bucket.
              var latestMoment = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).add(source.bucketSpan, 's');
              source.latest = latestMoment.toISOString();
          }
      }
      
      // If urlValue contains $prelertcategoryterms$ or $prelertcategoryregex$, add in the 
      // terms and regex for the selected categoryId to the source record.
      if ( (configuredUrlValue.includes("$prelertcategoryterms$") || configuredUrlValue.includes("$prelertcategoryregex$"))
              && _.has(source, 'prelertcategory') ) {
          var jobId = source['jobId'];
          var categoryId = source['prelertcategory'];
          
          prlJobService.getCategoryDefinition($scope.indexPattern.id, jobId, categoryId)
          .then(function(resp) {              
              // Prefix each of the terms with '+' so that the Elasticsearch Query String query
              // run in a drilldown Kibana dashboard has to match on all terms.
              var termsArray = _.map(resp.terms.split(' '), function(term){ return '+'+term; });
              source.prelertcategoryterms = termsArray.join(' ');
              source.prelertcategoryregex = resp.regex;
              
              // Replace any tokens in the configured urlValue with values from the source record,
              // and then open link in a new tab/window.
              var urlPath = stringUtils.replaceStringTokens(link.urlValue, source, true);
              $window.open(urlPath, '_blank');
              
          }).catch(function(resp) {
              console.log("openLink(): error loading categoryDefinition from Elasticsearch:", resp);
          });
          
      } else {
          // Replace any tokens in the configured urlValue with values from the source record,
          // and then open link in a new tab/window.
          var urlPath = stringUtils.replaceStringTokens(link.urlValue, source, true);
          $window.open(urlPath, '_blank');
      }
  };
  
  $scope.getExamplesForCategory = function(jobId, categoryId) {
      return _.get($scope.categoryExamplesByJob, [jobId, categoryId], []);
  }; 
  
  function loadCategoryExamples(categoryIdsByJobId) {
      // Load the example events for the specified map of jobIds and categoryIds from Elasticsearch.
      $scope.categoryExamplesByJob = {};
      _.each(categoryIdsByJobId, function(categoryIds, jobId) {
          prlResultsService.getCategoryExamples($scope.vis.indexPattern.id, jobId, categoryIds, MAX_NUMBER_CATEGORY_EXAMPLES)
          .then(function(resp) {
              $scope.categoryExamplesByJob[jobId] = resp.examplesByCategoryId;
          }).catch(function(resp) {
              console.log("Anomaly Summary Table - error getting category examples from Elasticsearch:", resp);
          });
      });  
  }
  
  function getPaginatedTableColumns(summaryRecords) {
      // Builds the list of columns for use in the paginated table:
      // row expand arrow
      // time
      // max severity
      // detector
      // found for (if by/over/partition)
      // influenced by (if influencers)
      // actual
      // typical
      // jobId
      // links (if links configured)
      // category examples (if by prelertcategory)
      var paginatedTableColumns = [
        { title: '', sortable: false, class: "col-expand-arrow" },
        { title: 'time', sortable: true },
        { title: 'max severity', sortable: true },
        { title: 'detector', sortable: true }];
      
      var showEntity = _.some(summaryRecords, 'entityValue');
      var showInfluencers = _.some(summaryRecords, 'influencers');
      var showMetrics = _.some(summaryRecords, 'actual');
      var showExamples = _.some(summaryRecords, {'entityName': 'prelertcategory'});
      var showLinks = _.some(summaryRecords, 'links');
      
      if (showEntity === true) {
          paginatedTableColumns.push({ title: 'found for', sortable: true });
      }
      if (showInfluencers === true) {
          paginatedTableColumns.push({ title: 'influenced by', sortable: true });
      }
      if (showMetrics === true) {
          paginatedTableColumns.push({ title: 'actual', sortable: true });
          paginatedTableColumns.push({ title: 'typical', sortable: true });
      }
      paginatedTableColumns.push({ title: 'jobId', sortable: true });
      if (showLinks === true) {
          paginatedTableColumns.push({ title: 'links', sortable: false });
      }
      if (showExamples === true) {
          paginatedTableColumns.push({ title: 'category examples', sortable: false });
      }

      return paginatedTableColumns;
  }
      
      
  function createTableRow(record) {
      var tableRow = [];
      
      var rowScope = $scope.$new();
      rowScope.expandable = true;
      rowScope.expandElement = "prl-anomaly-summary-expanded-row";
      rowScope.record = record;
      rowScope.filter = $scope.filter;
      rowScope.isShowingAggregatedData = $scope.isShowingAggregatedData();
      
      rowScope.initRow = function() {
          if (_.has(record, 'entityValue') && record.entityName === 'prelertcategory') {
              // Obtain the category definition and display the examples in the expanded row.
              prlJobService.getCategoryDefinition($scope.vis.indexPattern.id, record.jobId, record.entityValue)
              .then(function(resp) {
                  rowScope.categoryDefinition = {'examples':_.slice(resp.examples, 0, Math.min(resp.examples.length, MAX_NUMBER_CATEGORY_EXAMPLES))};
              }).catch(function(resp) {
                  console.log("createTableRow(): error loading categoryDefinition from ES:", resp);
              });
          }
          
          rowScope.$broadcast('initRow', record);
      };
      
      // Create a table row with the following columns:
      //   row expand arrow
      //   time
      //   max severity
      //   detector
      //   found for (if by/over/partition)
      //   influenced by (if influencers)
      //   jobId
      //   links (if links configured)
      var addEntity = _.findWhere($scope.table.columns, {'title':'found for'});
      var addInfluencers = _.findWhere($scope.table.columns, {'title':'influenced by'});
      var addMetrics = _.findWhere($scope.table.columns, {'title':'actual'});
      var addExamples = _.findWhere($scope.table.columns, {'title':'category examples'});
      var addLinks = _.findWhere($scope.table.columns, {'title':'links'});
      
      var tableRow = [ {
              markup: openRowArrow,
              scope:  rowScope
          },
          {
              markup: formatUnixTimestamp(record['time']),
              value: record['time']
          },
          {
              markup: parseInt(record['max severity']) >= 1 ? 
                  '<i class="fa fa-exclamation-triangle icon-severity-' + anomalyUtils.getSeverity(record['max severity']) + '"></i> ' + Math.floor(record['max severity']) :
                  '<i class="fa fa-exclamation-triangle icon-severity-' + anomalyUtils.getSeverity(record['max severity']) + '"></i> &lt; 1',
              value:  record['max severity']
          },
          {
              markup: record['detector'],
              value:  record['detector']
          }           
      ];
      
      if (addEntity !== undefined) {
          if (_.has(record, 'entityValue')) {
              if (record.entityName !== 'prelertcategory') {
                  tableRow.push({
                      markup: record['entityValue'],
                      value:  record['entityValue']
                  });
              } else {
                  tableRow.push({
                      markup: "prelertcategory " + record['entityValue'],
                      value:  record['entityValue']
                  });
              }
          } else {
              tableRow.push({
                  markup: '',
                  value: ''
              });
          }
      }
      
      if (addInfluencers !== undefined) {
          if (_.has(record, 'influencers')) {
              var cellMarkup = "";
              _.each(record.influencers, function(influencer){
                  _.each(influencer, function(influencerFieldValue, influencerFieldName){
                      cellMarkup += (influencerFieldName + ": " + influencerFieldValue + "<br>");
                  });
              });
              tableRow.push({
                  markup: cellMarkup,
                  value:  cellMarkup
              });
          } else {
              tableRow.push({
                  markup: '',
                  value: ''
              });
          }
      }
      
      if (addMetrics !== undefined) {
          if (_.has(record, 'actual')) {
              tableRow.push({markup: "{{ record.actual | timeOfWeek:record.source.function}}", value: record.actual, scope: rowScope });
              tableRow.push({markup: "{{ record.typical | timeOfWeek:record.source.function}}", value: record.typical, scope: rowScope });
          } else {
              tableRow.push({markup: '', value: '' });
              tableRow.push({markup: '', value: '' });
          }
      }
      
      tableRow.push({markup: record['jobId'], value: record['jobId']});
      
      if (addLinks !== undefined) {
          if (_.has(record, 'links')) {
              rowScope.links = record.links;
              rowScope.source = record.source;
              
              tableRow.push({
                  markup: linkControlsHtml,
                  scope: rowScope
              });
          } else {
              tableRow.push({
                  markup: '',
                  value: ''
              });
          }
      }
      
      if (addExamples !== undefined) {
          if (record.entityName === 'prelertcategory') {
              tableRow.push({ markup: '<span style="display: block; white-space:nowrap;" ng-repeat="item in getExamplesForCategory(record.jobId, record.entityValue)">{{item}}</span>', scope:  rowScope });
          } else {
              tableRow.push({ markup: '', value: '' });
          }
      }

      rowScopes.push(rowScope);
      
      return tableRow;
      
    }
 
    function formatUnixTimestamp(epochSecs) { 
        var time = moment.unix(epochSecs);  
        if (momentInterval === 'hour') {
            return time.format('MMMM Do YYYY, HH:mm');
        } else if (momentInterval === 'second') {
            return time.format('MMMM Do YYYY, HH:mm:ss');
        } else {
            return time.format('MMMM Do YYYY');
        }
    }
    
});