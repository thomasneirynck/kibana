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

import moment from 'moment';
import _ from 'lodash';

import stringUtils from 'plugins/prelert/util/string_utils';
import anomalyUtils from 'plugins/prelert/util/anomaly_utils';

import 'plugins/prelert/components/paginated_table';
import 'plugins/prelert/filters/metric_change_description';
import 'plugins/prelert/services/job_service';
import './expanded_row/expanded_row_directive';

import linkControlsHtml from './anomalies_table_links.html';
import openRowArrow from 'ui/doc_table/components/table_row/open.html';
import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlAnomaliesTable', function ($window, prlJobService, prlResultsService) {
  return {
    restrict: 'E',
    scope: {
      anomalyRecords: '=',
      indexPatternId: '=',
      timeFieldName: '='
    },
    template: require('plugins/prelert/timeseriesexplorer/anomalies_table/anomalies_table.html'),
    link: function (scope, element, $attrs) {
      console.log('prlAnomaliesTable scope:', scope);

      scope.thresholdOptions = [
        {display:'critical', val:75},
        {display:'major', val:50},
        {display:'minor', val:25},
        {display:'warning', val:0}];

      scope.intervalOptions = [
        {display:'Auto', val:'auto'},
        {display:'1 hour', val:'hour'},
        {display:'1 day', val:'day'},
        {display:'Show all', val:'second'}];

      scope.threshold = _.findWhere(scope.thresholdOptions, {val:0});

      // TODO - use a default of auto?
      scope.interval = _.findWhere(scope.intervalOptions, {val:'auto'});
      scope.momentInterval = 'second';

      scope.table = {};
      scope.table.perPage = 25;
      scope.table.columns = [];
      scope.table.rows = [];
      scope.rowScopes = [];

      scope.categoryExamplesByJob = {};
      const MAX_NUMBER_CATEGORY_EXAMPLES = 10;  // Max number of examples to show in table cell or expanded row (engine default is to store 4).

      scope.$on('renderTable',function (event, d) {
        updateTableData();
      });

      element.on('$destroy', function () {
        scope.$destroy();
      });

      scope.isShowingAggregatedData = function () {
        return (scope.interval.display !== 'Show all');
      };

      scope.setThreshold = function (threshold) {
        scope.threshold = threshold;
        updateTableData();
      };

      scope.setInterval = function (interval) {
        scope.interval = interval;
        updateTableData();
      };

      scope.getExamplesForCategory = function (jobId, categoryId) {
        return _.get(scope.categoryExamplesByJob, [jobId, categoryId], []);
      };

      scope.openLink = function (link, record) {
        console.log('Anomalies Table - open link for record:', link, record);

        // If urlValue contains $earliest$ and $latest$ tokens, add in times to the source record.
        const stringTime = record[scope.timeFieldName];
        const configuredUrlValue = link.urlValue;
        if (configuredUrlValue.includes('$earliest$')) {
          let roundedMoment = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).startOf(scope.momentInterval);
          if (scope.momentInterval === 'hour') {
            // Start from the previous hour.
            roundedMoment.subtract(1, 'h');
          }
          record.earliest = roundedMoment.toISOString();    // e.g. 2016-02-08T16:00:00.000Z
        }

        if (configuredUrlValue.includes('$latest$')) {
          if (scope.isShowingAggregatedData()) {
            let roundedMoment = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).endOf(scope.momentInterval);
            if (scope.momentInterval === 'hour') {
              // Show to the end of the next hour.
              roundedMoment.add(1, 'h');
            }
            record.latest = roundedMoment.toISOString();      // e.g. 2016-02-08T18:59:59.999Z
          } else {
            // Show the time span of the selected record's bucket.
            const latestMoment = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).add(record.bucketSpan, 's');
            record.latest = latestMoment.toISOString();
          }
        }

        // If urlValue contains $prelertcategoryterms$ or $prelertcategoryregex$, add in the
        // terms and regex for the selected categoryId to the source record.
        if ((configuredUrlValue.includes('$prelertcategoryterms$') || configuredUrlValue.includes('$prelertcategoryregex$'))
                && _.has(record, 'prelertcategory')) {
          const jobId = record.jobId;
          const categoryId = record.prelertcategory;

          prlJobService.getCategoryDefinition(scope.indexPattern.id, jobId, categoryId)
          .then(function (resp) {
            // Prefix each of the terms with '+' so that the Elasticsearch Query String query
            // run in a drilldown Kibana dashboard has to match on all terms.
            const termsArray = _.map(resp.terms.split(' '), function (term) { return '+' + term; });
            record.prelertcategoryterms = termsArray.join(' ');
            record.prelertcategoryregex = resp.regex;

            // Replace any tokens in the configured urlValue with values from the source record,
            // and then open link in a new tab/window.
            const urlPath = stringUtils.replaceStringTokens(link.urlValue, record, true);
            $window.open(urlPath, '_blank');

          }).catch(function (resp) {
            console.log('openLink(): error loading categoryDefinition:', resp);
          });

        } else {
          // Replace any tokens in the configured urlValue with values from the source record,
          // and then open link in a new tab/window.
          const urlPath = stringUtils.replaceStringTokens(link.urlValue, record, true);
          $window.open(urlPath, '_blank');
        }

      };

      function updateTableData() {
        let summaryRecords = [];
        if (scope.isShowingAggregatedData()) {
          // Aggregate the anomaly data by time and detector, and entity (by/over).
          summaryRecords = aggregateAnomalies();
        } else {
          // Show all anomaly records.
          scope.momentInterval = scope.interval.val;
          let filteredRecords = _.filter(scope.anomalyRecords, function (record) {
            return Number(record.normalizedProbability) >= scope.threshold.val;
          });

          _.each(filteredRecords, function (record) {
            const stringTime = record[scope.timeFieldName];
            const detectorIndex = record.detectorIndex;
            const jobId = record.jobId;
            let detector = record.functionDescription;
            if ((_.has(prlJobService.detectorsByJob, jobId)) && (detectorIndex < prlJobService.detectorsByJob[jobId].length)) {
              detector = prlJobService.detectorsByJob[jobId][detectorIndex].detectorDescription;
            }

            const displayRecord = {
              'time': moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).unix(),
              'max severity': record.normalizedProbability,
              'detector': detector,
              'jobId': jobId,
              'source': record
            };

            const entityName = anomalyUtils.getEntityFieldName(record);
            if (entityName !== undefined) {
              displayRecord.entityName = entityName;
              displayRecord.entityValue = anomalyUtils.getEntityFieldValue(record);
            }

            if (_.has(record, 'partitionFieldName')) {
              displayRecord.partitionFieldName = record.partitionFieldName;
              displayRecord.partitionFieldValue = record.partitionFieldValue;
            }

            if (_.has(record, 'influencers')) {
              const influencers = [];
              const sourceInfluencers = _.sortBy(record.influencers, 'influencerFieldName');
              _.each(sourceInfluencers, function (influencer) {
                const influencerFieldName = influencer.influencerFieldName;
                _.each(influencer.influencerFieldValues, function (influencerFieldValue) {
                  const influencerToAdd = {};
                  influencerToAdd[influencerFieldName] = influencerFieldValue;
                  influencers.push(influencerToAdd);
                });
              });
              displayRecord.influencers = influencers;
            }

            const functionDescription = _.get(record, 'functionDescription', '');
            if (anomalyUtils.showMetricsForFunction(functionDescription) === true) {
              if (_.has(record, 'actual')) {
                displayRecord.actual = record.actual;
                displayRecord.typical = record.typical;
              } else {
                // If only a single cause, copy values to the top level.
                if (_.get(record, 'causes', []).length === 1) {
                  const cause = _.first(record.causes);
                  displayRecord.actual = cause.actual;
                  displayRecord.typical = cause.typical;
                }
              }
            }

            if (_.has(prlJobService.customUrlsByJob, jobId)) {
              displayRecord.links = prlJobService.customUrlsByJob[jobId];
            }

            summaryRecords.push(displayRecord);

          });
        }

        _.invoke(scope.rowScopes, '$destroy');
        scope.rowScopes.length = 0;

        const showExamples = _.some(summaryRecords, {'entityName': 'prelertcategory'});
        if (showExamples) {
          // Obtain the list of categoryIds by jobId for which we need to obtain the examples.
          // Note category examples will not be displayed if prelertcategory is used just an
          // influencer or as a partition field in a config with other by/over fields.
          const categoryRecords = _.where(summaryRecords, {entityName: 'prelertcategory'});
          const categoryIdsByJobId = {};
          _.each(categoryRecords, function (record) {
            if (!_.has(categoryIdsByJobId, record.jobId)) {
              categoryIdsByJobId[record.jobId] = [];
            }
            categoryIdsByJobId[record.jobId].push(record.entityValue);
          });
          loadCategoryExamples(categoryIdsByJobId);
        } else {
          scope.categoryExamplesByJob = {};
        }

        // Only show columns in the table which exist in the results.
        scope.table.columns = getPaginatedTableColumns(summaryRecords);

        scope.table.rows = summaryRecords.map(function (record) {
          return createTableRow(record);
        });

      }

      function aggregateAnomalies() {
        // Aggregate the anomaly data by time, detector, and entity (by/over/partition).
        // TODO - do we want to aggregate by job too, in cases where different jobs
        // have detectors with the same description.
        console.log('aggregateAnomalies(): number of anomalies to aggregate:', scope.anomalyRecords.length);

        if (scope.anomalyRecords.length === 0) {
          return [];
        }

        // Determine the aggregation interval - records in scope are in descending time order.
        if (scope.interval.val === 'auto') {
          const earliest = moment(_.last(scope.anomalyRecords)[scope.timeFieldName], 'YYYY-MM-DDTHH:mm:ss.SSSZ', true);
          const latest = moment(_.first(scope.anomalyRecords)[scope.timeFieldName], 'YYYY-MM-DDTHH:mm:ss.SSSZ', true);
          const daysDiff = latest.diff(earliest, 'days');
          scope.momentInterval = (daysDiff < 2 ? 'hour' : 'day');
        } else {
          scope.momentInterval = scope.interval.val;
        }

        // Only show records passing the severity threshold.
        const filteredRecords = _.filter(scope.anomalyRecords, function (record) {

          return Number(record.normalizedProbability) >= scope.threshold.val;
        });

        let aggregatedData = {};
        _.each(filteredRecords, function (record) {
          const stringTime = record[scope.timeFieldName];

          // Use moment.js to get start of interval. This will use browser timezone.
          // TODO - support choice of browser or UTC timezone once funcitonality is in Kibana.
          const roundedTime = moment(stringTime, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).startOf(scope.momentInterval).unix();
          if (!_.has(aggregatedData, roundedTime)) {
            aggregatedData[roundedTime] = {};
          }

          // Aggregate by detector - default to functionDescription if no description available.
          const detectorIndex = record.detectorIndex;
          const jobId = record.jobId;
          let detector = record.functionDescription;
          if ((_.has(prlJobService.detectorsByJob, jobId)) && (detectorIndex < prlJobService.detectorsByJob[jobId].length)) {
            detector = prlJobService.detectorsByJob[jobId][detectorIndex].detectorDescription;
          }
          let detectorsAtTime = aggregatedData[roundedTime];
          if (!_.has(detectorsAtTime, detector)) {
            detectorsAtTime[detector] = {};
          }

          // Now add an object for the anomaly with the highest anomaly score per entity.
          // For the choice of entity, look in order for byField, overField, partitionField.
          // If no by/over/partition, default to an empty String.
          let entitiesForDetector = detectorsAtTime[detector];

          // TODO - are we worried about different byFields having the same
          // value e.g. host=server1 and machine=server1?
          let entity = anomalyUtils.getEntityFieldValue(record);
          if (entity === undefined) {
            entity = '';
          }
          if (!_.has(entitiesForDetector, entity)) {
            entitiesForDetector[entity] = record;
          } else {
            const score = record.normalizedProbability;
            if (score > entitiesForDetector[entity].normalizedProbability) {
              entitiesForDetector[entity] = record;
            }
          }
        });

        console.log('aggregateAnomalies() aggregatedData is:', aggregatedData);

        // Flatten the aggregatedData to give a list of records with the highest score per bucketed time / detector.
        let summaryRecords = [];
        _.each(aggregatedData, function (timeDetectors, roundedTime) {
          _.each(timeDetectors, function (entityDetectors, detector) {
            _.each(entityDetectors, function (record, entity) {
              let displayRecord = {
                'time': roundedTime,
                'max severity': record.normalizedProbability,
                'detector': detector,
                'jobId': record.jobId,
                'source': record
              };

              const entityName = anomalyUtils.getEntityFieldName(record);
              if (entityName !== undefined) {
                displayRecord.entityName = entityName;
                displayRecord.entityValue = entity;
              }

              if (_.has(record, 'partitionFieldName')) {
                displayRecord.partitionFieldName = record.partitionFieldName;
                displayRecord.partitionFieldValue = record.partitionFieldValue;
              }

              if (_.has(record, 'influencers')) {
                const influencers = [];
                const sourceInfluencers = _.sortBy(record.influencers, 'influencerFieldName');
                _.each(sourceInfluencers, function (influencer) {
                  const influencerFieldName = influencer.influencerFieldName;
                  _.each(influencer.influencerFieldValues, function (influencerFieldValue) {
                    const influencerToAdd = {};
                    influencerToAdd[influencerFieldName] = influencerFieldValue;
                    influencers.push(influencerToAdd);
                  });
                });
                displayRecord.influencers = influencers;
              }

              // Copy actual and typical values to the top level for display.
              const functionDescription = _.get(record, 'functionDescription', '');
              if (anomalyUtils.showMetricsForFunction(functionDescription) === true) {
                if (_.has(record, 'actual')) {
                  displayRecord.actual = record.actual;
                  displayRecord.typical = record.typical;
                } else {
                  // If only a single cause, copy values to the top level.
                  if (_.get(record, 'causes', []).length === 1) {
                    const cause = _.first(record.causes);
                    displayRecord.actual = cause.actual;
                    displayRecord.typical = cause.typical;
                  }
                }
              }


              // TODO - do we always want the links column visible even when no customUrls have been defined?
              if (_.has(prlJobService.customUrlsByJob, record.jobId)) {
                displayRecord.links = prlJobService.customUrlsByJob[record.jobId];
              }

              summaryRecords.push(displayRecord);

            });
          });
        });
        summaryRecords = (_.sortBy(summaryRecords, 'time')).reverse();
        console.log('aggregateAnomalies() returning list of summary records:', summaryRecords.length);
        return summaryRecords;

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
        let paginatedTableColumns = [
          { title: '', sortable: false, class: 'col-expand-arrow' },
          { title: 'time', sortable: true },
          { title: 'max severity', sortable: true },
          { title: 'detector', sortable: true }];

        const showEntity = _.some(summaryRecords, 'entityValue');
        const showInfluencers = _.some(summaryRecords, 'influencers');
        const showMetrics = _.some(summaryRecords, 'actual');
        const showExamples = _.some(summaryRecords, {'entityName': 'prelertcategory'});
        const showLinks = _.some(summaryRecords, 'links');

        if (showEntity === true) {
          paginatedTableColumns.push({ title: 'found for', sortable: true });
        }
        if (showInfluencers === true) {
          paginatedTableColumns.push({ title: 'influenced by', sortable: true });
        }
        if (showMetrics === true) {
          paginatedTableColumns.push({ title: 'actual', sortable: true });
          paginatedTableColumns.push({ title: 'typical', sortable: true });
          paginatedTableColumns.push({ title: 'description', sortable: true });
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
        let rowScope = scope.$new();
        rowScope.expandable = true;
        rowScope.expandElement = 'prl-anomalies-table-expanded-row';
        rowScope.record = record;
        rowScope.isShowingAggregatedData = scope.isShowingAggregatedData();

        rowScope.initRow = function () {
          if (_.has(record, 'entityValue') && record.entityName === 'prelertcategory') {
            // Obtain the category definition and display the examples in the expanded row.
            prlJobService.getCategoryDefinition(scope.indexPatternId, record.jobId, record.entityValue)
            .then(function (resp) {
              rowScope.categoryDefinition = {
                'examples':_.slice(resp.examples, 0, Math.min(resp.examples.length, MAX_NUMBER_CATEGORY_EXAMPLES))};
            }).catch(function (resp) {
              console.log('Anomalies table createTableRow(): error loading categoryDefinition:', resp);
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
        const addEntity = _.findWhere(scope.table.columns, {'title':'found for'});
        const addInfluencers = _.findWhere(scope.table.columns, {'title':'influenced by'});
        const addMetrics = _.findWhere(scope.table.columns, {'title':'actual'});
        const addExamples = _.findWhere(scope.table.columns, {'title':'category examples'});
        const addLinks = _.findWhere(scope.table.columns, {'title':'links'});

        const tableRow = [
          {
            markup: openRowArrow,
            scope:  rowScope
          },
          {
            markup: formatUnixTimestamp(record.time),
            value: record.time
          },
          {
            markup: parseInt(record['max severity']) >= 1 ?
            '<i class="fa fa-exclamation-triangle icon-severity-' + anomalyUtils.getSeverity(record['max severity']) + '"></i> '
              + Math.floor(record['max severity']) :
            '<i class="fa fa-exclamation-triangle icon-severity-' + anomalyUtils.getSeverity(record['max severity']) + '"></i> &lt; 1',
            value:  record['max severity']
          },
          {
            markup: record.detector,
            value:  record.detector
          }
        ];

        if (addEntity !== undefined) {
          if (_.has(record, 'entityValue')) {
            if (record.entityName !== 'prelertcategory') {
              tableRow.push({
                markup: record.entityValue,
                value:  record.entityValue
              });
            } else {
              tableRow.push({
                markup: 'prelertcategory ' + record.entityValue,
                value:  record.entityValue
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
            let cellMarkup = '';
            _.each(record.influencers, function (influencer) {
              _.each(influencer, function (influencerFieldValue, influencerFieldName) {
                cellMarkup += (influencerFieldName + ': ' + influencerFieldValue + '<br>');
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
            tableRow.push({markup: '{{ record.actual | timeOfWeek:record.source.function}}', value: record.actual, scope: rowScope });
            tableRow.push({markup: '{{ record.typical | timeOfWeek:record.source.function}}', value: record.typical, scope: rowScope });

            // Use the metricChangeDescription filter to format a textual description of actual vs typical.
            const factor = (record.actual > record.typical) ? record.actual / record.typical : record.typical / record. actual;
            tableRow.push({markup: '<span ng-bind-html="' + record.actual + ' | metricChangeDescription:record.typical"></span>',
              value: Math.abs(factor), scope: rowScope });
          } else {
            tableRow.push({markup: '', value: '' });
            tableRow.push({markup: '', value: '' });
            tableRow.push({markup: '', value: '' });
          }
        }

        tableRow.push({markup: record.jobId, value: record.jobId});

        // TODO - add in links
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
            tableRow.push({ markup: '<span style="display: block; white-space:nowrap;" ' +
              'ng-repeat="item in getExamplesForCategory(record.jobId, record.entityValue)">{{item}}</span>', scope:  rowScope });
          } else {
            tableRow.push({ markup: '', value: '' });
          }
        }

        scope.rowScopes.push(rowScope);

        return tableRow;

      }

      function loadCategoryExamples(categoryIdsByJobId) {
        // Load the example events for the specified map of jobIds and categoryIds from Elasticsearch.
        scope.categoryExamplesByJob = {};
        _.each(categoryIdsByJobId, function (categoryIds, jobId) {
          prlResultsService.getCategoryExamples(scope.indexPatternId, jobId, categoryIds, MAX_NUMBER_CATEGORY_EXAMPLES)
          .then(function (resp) {
            scope.categoryExamplesByJob[jobId] = resp.examplesByCategoryId;
          }).catch(function (resp) {
            console.log('Anomalies table - error getting category examples:', resp);
          });
        });
      }

      function formatUnixTimestamp(epochSecs) {
        const time = moment.unix(epochSecs);
        if (scope.momentInterval === 'hour') {
          return time.format('MMMM Do YYYY, HH:mm');
        } else if (scope.momentInterval === 'second') {
          return time.format('MMMM Do YYYY, HH:mm:ss');
        } else {
          return time.format('MMMM Do YYYY');
        }
      }

    }
  };
});
