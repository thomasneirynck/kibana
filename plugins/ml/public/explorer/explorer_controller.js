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
 * Angular controller for the Machine Learning Explorer dashboard. The controller makes
 * multiple queries to Elasticsearch to obtain the data to populate all the components
 * in the view.
 */

import _ from 'lodash';
import $ from 'jquery';

import 'plugins/ml/components/influencers_list';
import 'plugins/ml/components/job_select_list';
import 'plugins/ml/services/ml_dashboard_service';
import 'plugins/ml/services/job_service';
import 'plugins/ml/services/results_service';

import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';

import uiRoutes from 'ui/routes';
import checkLicense from 'plugins/ml/license/check_license';

uiRoutes
.when('/explorer/?', {
  template: require('./explorer.html'),
  resolve : {
    CheckLicense: checkLicense
  }
});

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlExplorerController', function ($scope, $timeout, $location, AppState, Private, timefilter,
  mlJobService, mlResultsService, mlDashboardService, mlExplorerDashboardService) {

  // TODO - move the index pattern into a setting?
  $scope.indexPatternId = '.ml-anomalies-*';
  $scope.timeFieldName = 'timestamp';
  $scope.showNoSelectionMessage = true;     // User must select a swimlane cell to view anomalies.
  timefilter.enabled = true;

  const TimeBuckets = Private(require('plugins/ml/util/ml_time_buckets'));

  const queryFilter = Private(FilterBarQueryFilterProvider);

  const MAX_INFLUENCER_FIELD_NAMES = 10;
  const MAX_INFLUENCER_FIELD_VALUES = 10;

  $scope.getSelectedJobIds = function () {
    const selectedJobs = _.filter($scope.jobs, (job) => { return job.selected; });
    return _.map(selectedJobs, function (job) {return job.id;});
  };

  $scope.viewBySwimlaneOptions = [];
  $scope.viewBySwimlaneData = { 'fieldName': '', 'laneLabels':[],
    'points':[], 'interval': 3600 };

  $scope.initializeVis = function () {
    // Initialize the AppState in which to store filters.
    const stateDefaults = {
      filters: []
    };
    $scope.state = new AppState(stateDefaults);

    // Load the job info needed by the dashboard, then do the first load.
    // Calling loadJobs() ensures the full datafeed config is available for building the charts.
    mlJobService.loadJobs().then((resp) => {
      if (resp.jobs.length > 0) {
        // Set any jobs passed in the URL as selected, otherwise check any saved in the Vis.
        let selectedJobIds = [];
        const urlSearch = $location.search();
        if (_.has(urlSearch, 'jobId')) {
          const jobIdParam = urlSearch.jobId;
          if (_.isArray(jobIdParam) === true) {
            selectedJobIds = jobIdParam;
          } else {
            selectedJobIds = [jobIdParam];
          }
        } else {
          selectedJobIds = $scope.getSelectedJobIds();
        }

        $scope.jobs = [];
        _.each(resp.jobs, (job) => {
          $scope.jobs.push({ id:job.job_id, selected: false, bucketSpan: +job.analysis_config.bucket_span });
        });

        $scope.setSelectedJobs(selectedJobIds);
      }

    }).catch((resp) => {
      console.log('Explorer - error getting job info from elasticsearch:', resp);
    });

    mlExplorerDashboardService.init();
  };

  $scope.loadAnomaliesTable = function (influencers, earliestMs, latestMs) {
    const selectedJobIds = $scope.getSelectedJobIds();

    mlResultsService.getRecordsForInfluencer($scope.indexPatternId, selectedJobIds, influencers,
      0, earliestMs, latestMs, 500)
    .then((resp) => {
      // Sort in descending time order before storing in scope.
      $scope.anomalyRecords = _.chain(resp.records).sortBy(function (record) { return record[$scope.timeFieldName]; }).reverse().value();
      console.log('Explorer anomalies table data set:', $scope.anomalyRecords);

      // Need to use $timeout to ensure the broadcast happens after the child scope is updated with the new data.
      $timeout(function () {
        $scope.$broadcast('renderTable');
      }, 0);
    });
  };

  $scope.loadAnomaliesForCharts = function (influencers, earliestMs, latestMs) {
    const selectedJobIds = $scope.getSelectedJobIds();

    // Load the top anomalies (by normalized_probability) which will be diplayed in the charts.
    // TODO - combine this with loadAnomaliesTable() if the table is being retained.
    mlResultsService.getRecordsForInfluencer($scope.indexPatternId, selectedJobIds, influencers,
      0, earliestMs, latestMs, 500)
    .then((resp) => {
      $scope.anomalyChartRecords = resp.records;
      console.log('Explorer anomaly charts data set:', $scope.anomalyChartRecords);

      mlExplorerDashboardService.fireAnomalyDataChange($scope.anomalyChartRecords, earliestMs, latestMs);

      // Need to use $timeout to ensure the broadcast happens after the child scope is updated with the new data.
      // TODO - do we need this as the way to re-render the charts?
      $timeout(function () {
        $scope.$broadcast('renderCharts');
      }, 0);
    });
  };

  $scope.setSelectedJobs = function (selections) {
    $scope.selectedJobs = [];
    const selectedJobIds = [];
    const selectAll = ((selections.length === 1 && selections[0] === '*') || selections.length === 0);
    _.each($scope.jobs, (job) => {
      job.selected = (selectAll || _.indexOf(selections, job.id) !== -1);
      if (job.selected) {
        $scope.selectedJobs.push(job);
        selectedJobIds.push(job.id);
      }
    });

    // Build scope objects used in the HTML template.
    $scope.unsafeHtml = '<ml-job-select-list selected="' + selectedJobIds.join(' ') + '"></ml-job-select-list>';

    // Crop long job IDs for display in the button text.
    // The first full job ID is displayed in the tooltip.
    let firstJobId = selectedJobIds[0];
    if (selectedJobIds.length > 1 && firstJobId.length > 22) {
      firstJobId = firstJobId.substring(0, 19) + '...';
    }
    $scope.selectJobBtnJobIdLabel = firstJobId;

    if (selectedJobIds.length > 0) {
      $location.search('jobId', selectedJobIds);
    }

    clearSelectedAnomalies();
    loadOverallData();
    loadViewBySwimlaneOptions();

  };

  $scope.setSwimlaneViewBy = function (viewByFieldName) {
    $scope.swimlaneViewByFieldName = viewByFieldName;
    loadViewBySwimlane();
    clearSelectedAnomalies();
  };

  // Refresh all the data when the time range is altered.
  $scope.$listen(timefilter, 'fetch', function () {
    loadOverallData();
    loadViewBySwimlane();
    clearSelectedAnomalies();
  });

  // Listen for changes to job selection.
  mlDashboardService.listenJobSelectionChange($scope, function (event, selections) {
    $scope.setSelectedJobs(selections);
  });

  // Refresh the data when the dashboard filters are updated.
  $scope.$listen(queryFilter, 'update', function () {
    // TODO - add in filtering functionality.
    console.log('explorer_controller queryFilter update, filters:', queryFilter.getFilters());
  });

  $scope.initializeVis();

  $scope.showViewBySwimlane = function () {
    return $scope.viewBySwimlaneData !== null && $scope.viewBySwimlaneData.laneLabels && $scope.viewBySwimlaneData.laneLabels.length > 0;
  };

  // Listener for click events in the swimlane and load corresponding anomaly data.
  // Empty cellData is passed on clicking outside a cell with score > 0.
  mlExplorerDashboardService.addSwimlaneCellClickListener((cellData) => {
    if (_.keys(cellData).length === 0) {
      // Swimlane deselection - clear anomalies section.
      clearSelectedAnomalies();
    } else {
      const influencers = [];
      if (cellData.fieldName !== undefined) {
        influencers.push({ fieldName: $scope.swimlaneViewByFieldName, fieldValue: cellData.laneLabel });
      }

      // Time range for charts should be maximum time span at job bucket span, centred on the selected cell.
      const bounds = timefilter.getActiveBounds();

      const earliestMs = cellData.time !== undefined ? cellData.time * 1000 : bounds.min.valueOf();
      const latestMs = cellData.time !== undefined ? ((cellData.time  + cellData.interval) * 1000) - 1 : bounds.max.valueOf();

      $scope.loadAnomaliesTable(influencers, earliestMs, latestMs);
      $scope.loadAnomaliesForCharts(influencers, earliestMs, latestMs);
      $scope.showNoSelectionMessage = false;
    }

  });

  function loadViewBySwimlaneOptions() {
    // Obtain the list of 'View by' fields per job.
    $scope.swimlaneViewByFieldName = null;
    let viewByOptions = [];   // Unique influencers for the selected job(s).

    const selectedJobIds = $scope.getSelectedJobIds();
    const fieldsByJob = {'*':[]};
    _.each(mlJobService.jobs, (job) => {
      // Add the list of distinct by, over, partition and influencer fields for each job.
      let fieldsForJob = [];

      const analysisConfig = job.analysis_config;
      const detectors = analysisConfig.detectors || [];
      _.each(detectors, (detector) => {
        if (_.has(detector, 'partition_field_name')) {
          fieldsForJob.push(detector.partition_field_name);
        }
        if (_.has(detector, 'over_field_name')) {
          fieldsForJob.push(detector.over_field_name);
        }
        // For jobs with by and over fields, don't add the 'by' field as this
        // field will only be added to the top-level fields for record type results
        // if it also an influencer over the bucket.
        if (_.has(detector, 'by_field_name') && !(_.has(detector, 'over_field_name'))) {
          fieldsForJob.push(detector.by_field_name);
        }
      });

      const influencers = analysisConfig.influencers || [];
      fieldsForJob = fieldsForJob.concat(influencers);
      if (selectedJobIds.indexOf(job.job_id) !== -1) {
        viewByOptions = viewByOptions.concat(influencers);
      }

      fieldsByJob[job.job_id] = _.uniq(fieldsForJob);
      fieldsByJob['*'] = _.union(fieldsByJob['*'], fieldsByJob[job.job_id]);
    });

    $scope.fieldsByJob = fieldsByJob;   // Currently unused but may be used if add in view by detector.
    viewByOptions = _.uniq(viewByOptions);
    $scope.viewBySwimlaneOptions =
      _.chain(viewByOptions).uniq().sortBy((fieldname) => { return fieldname.toLowerCase(); }).value();

    // Set the default to the first partition, over, by or influencer field of the first selected job.
    const firstSelectedJob = _.find(mlJobService.jobs, (job) => {
      return job.job_id === selectedJobIds[0];
    });

    const firstJobInfluencers = firstSelectedJob.analysis_config.influencers || [];
    _.each(firstSelectedJob.analysis_config.detectors,(detector) => {

      if (_.has(detector, 'partition_field_name') &&
          firstJobInfluencers.indexOf(detector.partition_field_name) !== -1) {
        $scope.swimlaneViewByFieldName = detector.partition_field_name;
        return false;
      }

      if (_.has(detector, 'over_field_name') &&
          firstJobInfluencers.indexOf(detector.over_field_name) !== -1) {
        $scope.swimlaneViewByFieldName = detector.over_field_name;
        return false;
      }

      // For jobs with by and over fields, don't add the 'by' field as this
      // field will only be added to the top-level fields for record type results
      // if it also an influencer over the bucket.
      if (_.has(detector, 'by_field_name') && !(_.has(detector, 'over_field_name')) &&
          firstJobInfluencers.indexOf(detector.by_field_name) !== -1) {
        $scope.swimlaneViewByFieldName = detector.by_field_name;
        return false;
      }
    });

    if ($scope.swimlaneViewByFieldName === null) {
      if (firstJobInfluencers.length > 0) {
        $scope.swimlaneViewByFieldName = firstJobInfluencers[0];
      } else {
        // No influencers for first selected job - set to first available option.
        $scope.swimlaneViewByFieldName = $scope.viewBySwimlaneOptions.length > 0 ? $scope.viewBySwimlaneOptions[0] : null;
      }
    }

    loadViewBySwimlane();

  }

  function loadOverallData() {
    // Loads the overall data components i.e. the overall swimlane and influencers list.

    if ($scope.selectedJobs === undefined) {
      return;
    }

    $scope.loading = true;
    $scope.hasResults = false;

    // Counter to keep track of what data sets have been loaded.
    let awaitingCount = 2;

    // finish() function, called after each data set has been loaded and processed.
    // The last one to call it will trigger the page render.
    function finish() {
      awaitingCount--;
      if (awaitingCount === 0) {

        // TODO: Check against bucket results as jobs may not include influencers.
        if ($scope.overallSwimlaneData.points && $scope.overallSwimlaneData.points.length) {
          $scope.hasResults = true;
        } else {
          $scope.hasResults = false;
        }
        $scope.loading = false;

        // Tell the result components directives to render.
        // Need to use $timeout to ensure the broadcast happens after the child scope is updated with the new data.
        $timeout(function () {
          $scope.$broadcast('render');
          mlExplorerDashboardService.fireSwimlaneDataChange('overall');
        }, 0);
      }
    }

    $scope.swimlaneBucketInterval = calculateSwimlaneBucketInterval();
    console.log('Explorer swimlane bucketInterval:', $scope.swimlaneBucketInterval);

    const bounds = timefilter.getActiveBounds();
    const selectedJobIds = $scope.getSelectedJobIds();

    // Query 1 - load list of top influencers.
    mlResultsService.getTopInfluencers($scope.indexPatternId, selectedJobIds,
      bounds.min.valueOf(), bounds.max.valueOf(), MAX_INFLUENCER_FIELD_NAMES, MAX_INFLUENCER_FIELD_VALUES)
    .then((resp) => {
      // TODO - sort the influencers keys so that the partition field(s) are first.
      $scope.influencersData = resp.influencers;
      console.log('Explorer top influencers data set:', $scope.influencersData);
      finish();
    });

    // Query 2 - load 'overall' scores by time - using max of bucket_influencer anomaly_score.
    // TODO - is this giving us the results we want?
    mlResultsService.getBucketInfluencerMaxScoreByTime($scope.indexPatternId, selectedJobIds,
      bounds.min.valueOf(), bounds.max.valueOf(), $scope.swimlaneBucketInterval.expression)
    .then((resp) => {
      processOverallResults(resp.results);
      console.log('Explorer overall swimlane data set:', $scope.overallSwimlaneData);
      finish();
    });

  }

  function loadViewBySwimlane() {
    // finish() function, called after each data set has been loaded and processed.
    // The last one to call it will trigger the page render.
    function finish() {
      console.log('Explorer view by swimlane data set:', $scope.viewBySwimlaneData);
      // Fire event to indicate swimlane data has changed.
      // Need to use $timeout to ensure this happens after the child scope is updated with the new data.
      $timeout(function () {
        mlExplorerDashboardService.fireSwimlaneDataChange('viewBy');
      }, 0);
    }

    if ($scope.selectedJobs === undefined ||
        $scope.swimlaneViewByFieldName === undefined  || $scope.swimlaneViewByFieldName === null) {
      $scope.viewBySwimlaneData = { 'fieldName': '', 'laneLabels':[], 'points':[], 'interval': 3600 };
      finish();
    } else {
      const bounds = timefilter.getActiveBounds();
      const selectedJobIds = $scope.getSelectedJobIds();

      // load scores by influencer value and time.
      mlResultsService.getInfluencerValueMaxScoreByTime($scope.indexPatternId, selectedJobIds, $scope.swimlaneViewByFieldName,
        bounds.min.valueOf(), bounds.max.valueOf(), $scope.swimlaneBucketInterval.expression, MAX_INFLUENCER_FIELD_VALUES)
      .then((resp) => {
        // TODO - sort the influencers keys so that the partition field(s) are first.
        processViewByResults(resp.results);
        finish();
      });
    }
  }

  function clearSelectedAnomalies() {
    $scope.anomalyChartRecords = {};
    $scope.anomalyRecords = [];
    $scope.showNoSelectionMessage = true;
  }

  function calculateSwimlaneBucketInterval() {
    // Bucketing interval should be the maximum of the chart related interval (i.e. time range related)
    // and the max bucket span for the jobs shown in the chart.
    const bounds = timefilter.getActiveBounds();
    const buckets = new TimeBuckets();
    buckets.setInterval('auto');
    buckets.setBounds(bounds);

    const intervalSeconds = buckets.getInterval().asSeconds();

    // if the swimlane cell widths are too small they will not be visible
    // calculate how many buckets will be drawn before the swimlanes are actually rendered
    // and increase the interval to widen the cells if they're going to be smaller than 8px
    // this has to be done at this stage so all searches use the same interval
    const numBuckets = parseInt(((bounds.max.valueOf() - bounds.min.valueOf()) / 1000) / intervalSeconds);
    const swimlaneWidth = getSwimlaneContainerWidth();
    const cellWidth = Math.floor(swimlaneWidth / numBuckets);
    $scope.swimlaneWidth = swimlaneWidth;

    // if the cell width is going to be less than 8px, double the interval
    if (cellWidth < 8) {
      buckets.setInterval((intervalSeconds * 2) + 's');
    }

    const selectedJobs = _.filter($scope.jobs, job => job.selected);
    const maxBucketSpan = _.reduce(selectedJobs, (memo, job) => Math.max(memo, job.bucketSpan) , 0);
    if (maxBucketSpan > intervalSeconds) {
      buckets.setInterval(maxBucketSpan + 's');
      buckets.setBounds(bounds);
    }

    return buckets.getInterval();
  }

  function getSwimlaneContainerWidth() {
    // swimlane width is 5 sixths of the window, minus 170 for the lane labels, minus 50 padding
    return (($('.ml-explorer').width() / 6) * 5) - 170 - 50;
  }

  function processOverallResults(scoresByTime) {
    const dataset = { 'laneLabels':['Overall'], 'points':[], 'interval': $scope.swimlaneBucketInterval.asSeconds() };

    // Store the earliest and latest times of the data returned by the ES aggregations,
    // These will be used for calculating the earliest and latest times for the swimlane charts.
    dataset.earliest = Number.MAX_VALUE;
    dataset.latest = 0;

    _.each(scoresByTime, (score, timeMs) => {
      const time = timeMs / 1000;
      dataset.points.push({ 'laneLabel':'Overall', 'time': time, 'value': score });

      dataset.earliest = Math.min(time, dataset.earliest);
      dataset.latest = Math.max((time + dataset.interval), dataset.latest);
    });

    // Adjust the earliest back to the first bucket at or before the start time in the time picker,
    // and the latest forward to the end of the bucket at or after the end time in the time picker.
    // Due to the way the swimlane sections are plotted, the chart buckets
    // must coincide with the times of the buckets in the data.
    const bounds = timefilter.getActiveBounds();
    const boundsMin = bounds.min.valueOf() / 1000;
    const boundsMax = bounds.max.valueOf() / 1000;
    const bucketIntervalSecs = $scope.swimlaneBucketInterval.asSeconds();
    if (dataset.earliest > boundsMin) {
      dataset.earliest = dataset.earliest - (Math.ceil((dataset.earliest - boundsMin) / bucketIntervalSecs) * bucketIntervalSecs);
    }
    if (dataset.latest < boundsMax) {
      dataset.latest = dataset.latest + (Math.ceil((boundsMax - dataset.latest) / bucketIntervalSecs) * bucketIntervalSecs);
    }

    $scope.overallSwimlaneData = dataset;
  }

  function processViewByResults(scoresByInfluencerAndTime) {
    const dataset = { 'fieldName': $scope.swimlaneViewByFieldName, 'laneLabels':[],
      'points':[], 'interval': $scope.swimlaneBucketInterval.asSeconds() };

    // Set the earliest and latest to be the same as the overall swimlane.
    dataset.earliest = $scope.overallSwimlaneData.earliest;
    dataset.latest = $scope.overallSwimlaneData.latest;

    _.each(scoresByInfluencerAndTime, (influencerData, influencerFieldValue) => {
      dataset.laneLabels.push(influencerFieldValue);

      _.each(influencerData, (anomalyScore, timeMs) => {
        const time = timeMs / 1000;
        dataset.points.push({ 'laneLabel': influencerFieldValue, 'time': time, 'value': anomalyScore });
      });
    });

    $scope.viewBySwimlaneData = dataset;
  }

});
