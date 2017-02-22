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

module.controller('MlExplorerChartsContainerController', function ($scope, timefilter, mlJobService, mlExplorerDashboardService) {

  $scope.allSeriesRecords = [];   // Complete list of series.
  $scope.recordsForSeries = [];   // Series for plotting.

  mlExplorerDashboardService.addAnomalyDataChangeListener(function (anomalyRecords, earliestMs, latestMs) {
    $scope.allSeriesRecords = processRecordsForDisplay(anomalyRecords);

    // Build the data configs of the anomalies to be displayed.
    // TODO - implement paging?
    // For now just take first 6.
    const recordsToPlot = $scope.allSeriesRecords.slice(0, 6);
    $scope.seriesToPlot = buildDataConfigs(recordsToPlot);

    const midpointMs = Math.ceil((earliestMs + latestMs) / 2);
    const chartRange = calculateChartRange(midpointMs);

    $scope.plotEarliest = chartRange.min;
    $scope.plotLatest = chartRange.max;
  });

  function processRecordsForDisplay(anomalyRecords) {
    // Aggregate the anomaly data by detector, and entity (by/over/partition).
    if (anomalyRecords.length === 0) {
      return [];
    }

    // Aggregate by job, detector, and analysis fields (partition, by, over).
    // TODO - initially just look at partition field, then add in by and over fields.
    const aggregatedData = {};
    _.each(anomalyRecords, function (record) {
      const jobId = record.job_id;
      if (!_.has(aggregatedData, jobId)) {
        aggregatedData[jobId] = {};
      }
      const detectorsForJob = aggregatedData[jobId];

      const detectorIndex = record.detector_index;
      if (!_.has(detectorsForJob, detectorIndex)) {
        detectorsForJob[detectorIndex] = {};
      }

      const partitionFieldName = record.partition_field_name;
      if (partitionFieldName !== undefined) {
        const partitionsForDetector = detectorsForJob[detectorIndex];

        if (!_.has(partitionsForDetector, partitionFieldName)) {
          partitionsForDetector[partitionFieldName] = {};
        }
        const valuesForPartition = partitionsForDetector[partitionFieldName];
        const partitionFieldValue = record.partition_field_value;
        if (!_.has(valuesForPartition, partitionFieldValue)) {
          valuesForPartition[partitionFieldValue] = {};
        }

        const dataForPartitionValue = valuesForPartition[partitionFieldValue];
        if (!_.has(dataForPartitionValue, 'anomaly_score')) {
          dataForPartitionValue.maxScore = record.normalized_probability;
          dataForPartitionValue.maxScoreRecord = record;
        } else {
          if (record.normalized_probability > dataForPartitionValue.maxScore) {
            dataForPartitionValue.maxScore = record.normalized_probability;
            dataForPartitionValue.maxScoreRecord = record;
          }
        }
      }

    });

    console.log('explorer charts aggregatedData is:', aggregatedData);
    let recordsForSeries = [];
    // Convert to an array of the records with the highesy normalized_probability per unique series.
    // TODO - will need a different algorithm depending on whether there are partition, by, and / or over fields.
    _.each(aggregatedData, (detectorsForJob) => {
      _.each(detectorsForJob, (partitionsForDetector) => {
        _.each(partitionsForDetector, (valuesForPartition) => {
          _.each(valuesForPartition, (dataForPartitionValue) => {
            recordsForSeries.push(dataForPartitionValue.maxScoreRecord);
          });
        });
      });
    });
    recordsForSeries = (_.sortBy(recordsForSeries, 'normalized_probability')).reverse();

    return recordsForSeries;
  }

  function buildDataConfigs(anomalyRecords) {
    // For each series, store the record and properties of the data feed (ES index, metric function etc).
    const seriesConfigs = [];

    _.each(anomalyRecords, (record) => {
      // TODO - add in full entity fields (by, over, partition).
      // TODO - get right ES metric function from record function_description.
      const job = _.find(mlJobService.jobs, { 'job_id': record.job_id });
      const config = {
        job_id: record.job_id,
        partition_field_name: record.partition_field_name,
        partition_field_value: record.partition_field_value,
        function: 'avg',
        field_name: record.field_name,
        job_bucket_span: job.analysis_config.bucket_span,
        interval: job.analysis_config.bucket_span + 's'
      };

      // Obtain the raw data index(es) from the job datafeed_config.
      if (job.datafeed_config) {
        config.datafeed_config = job.datafeed_config;
      }

      seriesConfigs.push(config);
    });
    return seriesConfigs;
  }

  function calculateChartRange(midpointMs) {
    // Calculate the time range for the charts.
    // Fit in as many points in the available container width plotted at the job bucket span.
    const maxBucketSpan = Math.max.apply(null, _.pluck($scope.seriesToPlot, 'job_bucket_span'));

    const chartWidth = getChartContainerWidth();
    const pointSpacing = 10;
    const numPoints = chartWidth / pointSpacing;

    return {min: midpointMs - (numPoints * maxBucketSpan * 1000), max: midpointMs + (numPoints * maxBucketSpan * 1000)};
  }

  function getChartContainerWidth() {
    // chart width is 5 sixths of the window, minus 100 for the axis labels, minus 50 padding.
    // TODO - alter depending on number of charts plotted per row.
    return (($('.ml-explorer').width() / 6) * 5) - 100 - 50;
  }

});
