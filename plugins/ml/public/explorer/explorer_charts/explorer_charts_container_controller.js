/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
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
 * Angular controller for the container for the anomaly charts in the
 * Machine Learning Explorer dashboard.
 * The controller processes the data required to draw each of the charts
 * and manages the layout of the charts in the containing div.
 */

import _ from 'lodash';
import $ from 'jquery';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');
import {aggregationTypeTransform} from 'plugins/ml/util/anomaly_utils';

module.controller('MlExplorerChartsContainerController', function ($scope, timefilter, mlJobService, mlExplorerDashboardService) {

  $scope.allSeriesRecords = [];   // Complete list of series.
  $scope.recordsForSeries = [];   // Series for plotting.

  const FUNCTION_DESCRIPTIONS_TO_PLOT = ['mean', 'min', 'max', 'sum', 'count', 'distinct_count'];

  mlExplorerDashboardService.addAnomalyDataChangeListener(function (anomalyRecords, earliestMs, latestMs) {
    $scope.allSeriesRecords = processRecordsForDisplay(anomalyRecords);

    // Calculate the number of charts per row, depending on the width available, to a max of 4.
    const chartsContainerWidth = $('.explorer-charts').width();
    const chartsPerRow = Math.min(Math.max(Math.floor(chartsContainerWidth / 600), 1), 4);

    $scope.chartsPerRow = chartsPerRow;
    $scope.layoutCellsPerChart = 12 / $scope.chartsPerRow;

    // Build the data configs of the anomalies to be displayed.
    // TODO - implement paging?
    // For now just take first 6 (or 8 if 4 charts per row).
    const maxSeriesToPlot = Math.max(chartsPerRow * 2, 6);
    const recordsToPlot = $scope.allSeriesRecords.slice(0, maxSeriesToPlot);
    $scope.seriesToPlot = buildDataConfigs(recordsToPlot);

    // Calculate the time range of the charts, which is a function of the chart width and max job bucket span.
    const midpointMs = Math.ceil((earliestMs + latestMs) / 2);
    const chartRange = calculateChartRange(midpointMs, Math.floor(chartsContainerWidth / chartsPerRow));

    $scope.plotEarliest = chartRange.min;
    $scope.plotLatest = chartRange.max;

    $scope.selectedEarliest = earliestMs;
    $scope.selectedLatest = latestMs;
  });

  function processRecordsForDisplay(anomalyRecords) {
    // Aggregate the anomaly data by detector, and entity (by/over/partition).
    if (anomalyRecords.length === 0) {
      return [];
    }

    // Aggregate by job, detector, and analysis fields (partition, by, over).
    const aggregatedData = {};
    _.each(anomalyRecords, (record) => {
      if (_.indexOf(FUNCTION_DESCRIPTIONS_TO_PLOT, record.function_description) === -1 ||
        record.by_field_name === 'mlcategory') {
        return;
      }
      const jobId = record.job_id;
      if (!_.has(aggregatedData, jobId)) {
        aggregatedData[jobId] = {};
      }
      const detectorsForJob = aggregatedData[jobId];

      const detectorIndex = record.detector_index;
      if (!_.has(detectorsForJob, detectorIndex)) {
        detectorsForJob[detectorIndex] = {};
      }

      // TODO - work out how best to display results from detectors with just an over field.
      const firstFieldName = record.partition_field_name || record.by_field_name || record.over_field_name;
      const firstFieldValue = record.partition_field_value || record.by_field_value || record.over_field_value;
      if (firstFieldName !== undefined) {
        const groupsForDetector = detectorsForJob[detectorIndex];

        if (!_.has(groupsForDetector, firstFieldName)) {
          groupsForDetector[firstFieldName] = {};
        }
        const valuesForGroup = groupsForDetector[firstFieldName];
        if (!_.has(valuesForGroup, firstFieldValue)) {
          valuesForGroup[firstFieldValue] = {};
        }

        const dataForGroupValue = valuesForGroup[firstFieldValue];

        let isSecondSplit = false;
        if (record.partition_field_name !== undefined) {
          const splitFieldName = record.over_field_name || record.by_field_name;
          if (splitFieldName !== undefined) {
            isSecondSplit = true;
          }
        }

        if (isSecondSplit === false) {
          if (!_.has(dataForGroupValue, 'anomaly_score')) {
            dataForGroupValue.maxScore = record.normalized_probability;
            dataForGroupValue.maxScoreRecord = record;
          } else {
            if (record.normalized_probability > dataForGroupValue.maxScore) {
              dataForGroupValue.maxScore = record.normalized_probability;
              dataForGroupValue.maxScoreRecord = record;
            }
          }
        } else {
          // Aggregate another level for the over or by field.
          const secondFieldName = record.over_field_name || record.by_field_name;
          const secondFieldValue = record.over_field_value || record.by_field_value;

          if (!_.has(dataForGroupValue, secondFieldName)) {
            dataForGroupValue[secondFieldName] = {};
          }

          const splitsForGroup = dataForGroupValue[secondFieldName];
          if (!_.has(splitsForGroup, secondFieldValue)) {
            splitsForGroup[secondFieldValue] = {};
          }

          const dataForSplitValue = splitsForGroup[secondFieldValue];
          if (!_.has(dataForSplitValue, 'anomaly_score')) {
            dataForSplitValue.maxScore = record.normalized_probability;
            dataForSplitValue.maxScoreRecord = record;
          } else {
            if (record.normalized_probability > dataForSplitValue.maxScore) {
              dataForSplitValue.maxScore = record.normalized_probability;
              dataForSplitValue.maxScoreRecord = record;
            }
          }
        }
      } else {
        // Detector with no partition or by field.
        const dataForDetector = detectorsForJob[detectorIndex];
        if (!_.has(dataForDetector, 'maxScore')) {
          dataForDetector.maxScore = record.normalized_probability;
          dataForDetector.maxScoreRecord = record;
        } else {
          if (record.normalized_probability > dataForDetector.maxScore) {
            dataForDetector.maxScore = record.normalized_probability;
            dataForDetector.maxScoreRecord = record;
          }
        }
      }

    });

    console.log('explorer charts aggregatedData is:', aggregatedData);
    let recordsForSeries = [];
    // Convert to an array of the records with the highesy normalized_probability per unique series.
    _.each(aggregatedData, (detectorsForJob) => {
      _.each(detectorsForJob, (groupsForDetector) => {
        if (_.has(groupsForDetector, 'maxScoreRecord')) {
          // Detector with no partition / by field.
          recordsForSeries.push(groupsForDetector.maxScoreRecord);
        } else {
          _.each(groupsForDetector, (valuesForGroup) => {
            _.each(valuesForGroup, (dataForGroupValue) => {
              if (_.has(dataForGroupValue, 'maxScoreRecord')) {
                recordsForSeries.push(dataForGroupValue.maxScoreRecord);
              } else {
                // Second level of aggregation for partition and by/over.
                _.each(dataForGroupValue, (splitsForGroup) => {
                  _.each(splitsForGroup, (dataForSplitValue) => {
                    recordsForSeries.push(dataForSplitValue.maxScoreRecord);
                  });
                });
              }
            });
          });
        }
      });
    });
    recordsForSeries = (_.sortBy(recordsForSeries, 'normalized_probability')).reverse();

    return recordsForSeries;
  }

  function buildDataConfigs(anomalyRecords) {
    // For each series, store the record and properties of the data feed (ES index, metric function etc).
    const seriesConfigs = [];

    _.each(anomalyRecords, (record) => {
      const job = _.find(mlJobService.jobs, { 'job_id': record.job_id });
      const config = {
        jobId: record.job_id,
        function: record.function_description,
        metricFunction: aggregationTypeTransform.toES(record.function_description),
        jobBucketSpan: job.analysis_config.bucket_span,
        interval: job.analysis_config.bucket_span + 's'
      };

      config.detectorLabel = record.function;
      if (record.field_name !== undefined) {
        config.fieldName = record.field_name;
        config.metricFieldName = record.field_name;
        config.detectorLabel += ' ';
        config.detectorLabel += config.fieldName;
      }

      // For count detectors using summary_count_field, plot sum(summary_count_field_name)
      if (record.function_description === 'count' && job.analysis_config.summary_count_field_name !== undefined
        && job.analysis_config.summary_count_field_name !== 'doc_count') {
        config.metricFunction = 'sum';
        config.metricFieldName = job.analysis_config.summary_count_field_name;
      }

      // Add the 'entity_fields' i.e. the partition, by, over fields which
      // define the metric series to be plotted.
      config.entityFields = [];
      if (_.has(record, 'partition_field_name')) {
        config.entityFields.push({fieldName: record.partition_field_name, fieldValue: record.partition_field_value});
      }

      if (_.has(record, 'over_field_name')) {
        config.entityFields.push({fieldName: record.over_field_name, fieldValue: record.over_field_value});
      }

      // For jobs with by and over fields, don't add the 'by' field as this
      // field will only be added to the top-level fields for record type results
      // if it also an influencer over the bucket.
      if (_.has(record, 'by_field_name') && !(_.has(record, 'over_field_name'))) {
        config.entityFields.push({fieldName: record.by_field_name, fieldValue: record.by_field_value});
      }

      // Obtain the raw data index(es) from the job datafeed_config.
      if (job.datafeed_config) {
        config.datafeedConfig = job.datafeed_config;
      }

      seriesConfigs.push(config);
    });

    return seriesConfigs;
  }

  function calculateChartRange(midpointMs, chartWidth) {
    // Calculate the time range for the charts.
    // Fit in as many points in the available container width plotted at the job bucket span.
    const maxBucketSpan = Math.max.apply(null, _.pluck($scope.seriesToPlot, 'jobBucketSpan'));

    //const chartWidth = getChartContainerWidth();
    const pointSpacing = 10;
    const numPoints = chartWidth / pointSpacing;

    return {min: midpointMs - (numPoints * maxBucketSpan * 1000), max: midpointMs + (numPoints * maxBucketSpan * 1000)};
  }

});
