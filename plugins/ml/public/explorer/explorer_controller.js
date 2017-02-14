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
import uiRoutes from 'ui/routes';

import 'plugins/ml/components/influencers_list';
import 'plugins/ml/components/job_select_list';
import 'plugins/ml/services/ml_dashboard_service';
import 'plugins/ml/services/job_service';
import 'plugins/ml/services/results_service';

import FilterBarQueryFilterProvider from 'ui/filter_bar/query_filter';

uiRoutes
.when('/explorer/?', {
  template: require('./explorer.html')
});

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlExplorerController', function ($scope, $timeout, $location, AppState, Private, timefilter,
  mlJobService, mlResultsService, mlDashboardService, mlExplorerDashboardService) {

  // TODO - move the index pattern into a setting?
  $scope.indexPatternId = '.ml-anomalies-*';
  $scope.timeFieldName = 'timestamp';
  timefilter.enabled = true;

  const TimeBuckets = Private(require('plugins/ml/util/ml_time_buckets'));

  const queryFilter = Private(FilterBarQueryFilterProvider);

  const MAX_INFLUENCER_FIELD_NAMES = 10;
  const MAX_INFLUENCER_FIELD_VALUES = 10;

  $scope.getSelectedJobIds = function () {
    const selectedJobs = _.filter($scope.jobs, (job) => { return job.selected; });
    return _.map(selectedJobs, function (job) {return job.id;});
  };

  $scope.viewBySwimlaneData = { 'fieldName': '', 'laneLabels':[],
    'points':[], 'interval': 3600 };

  $scope.initializeVis = function () {
    // Initialize the AppState in which to store filters.
    const stateDefaults = {
      filters: []
    };
    $scope.state = new AppState(stateDefaults);

    // Load the job info needed by the dashboard, then do the first load.
    mlJobService.getBasicJobInfo($scope.indexPatternId)
    .then(function (resp) {
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
        _.each(resp.jobs, function (job) {
          $scope.jobs.push({ id:job.id, selected: false, bucketSpan: job.bucketSpan });
        });

        $scope.setSelectedJobs(selectedJobIds);
      }

    }).catch(function (resp) {
      console.log('Explorer - error getting job info from elasticsearch:', resp);
    });

    mlExplorerDashboardService.init();
  };


  $scope.loadViewBySwimlaneOptions = function () {
    // Obtain the list of 'View by' fields per job.
    // TODO - for phase 2, enhance / replace getJobViewByFields with a function
    // which returns a list of influencer, by, over and partition fields and by default
    // set the 'view by' field to the partition field influencer.
    mlJobService.getJobViewByFields()
    .then(function (resp) {
      if (resp.fieldsByJob) {
        $scope.fieldsByJob = resp.fieldsByJob;
        console.log('Explorer job view by fields:', $scope.fieldsByJob);

        // TODO - what default to set when multiple jobs with multiple detectors are selected?
        // For now just pick the first field of the first selected job.
        const selectedJobIds = $scope.getSelectedJobIds();
        const fieldsForFirstSelected = $scope.fieldsByJob[selectedJobIds[0]];
        $scope.swimlaneViewByFieldName = fieldsForFirstSelected.length > 0 ? fieldsForFirstSelected[0] : null;
        console.log('Explorer default swimlane view by to:', $scope.swimlaneViewByFieldName);
        $scope.loadViewBySwimlane();
      }
    }).catch(function (resp) {
      console.log('Swimlane - error getting job viewBy fields:', resp);
    });
  };

  $scope.loadOverallData = function () {
    // Loads the overall data components i.e. the overall swimlane, influencers list, and anomalies table.

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
          mlExplorerDashboardService.fireSwimlaneDataChanged('overall');
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
    .then(function (resp) {
      // TODO - sort the influencers keys so that the partition field(s) are first.
      $scope.influencersData = resp.influencers;
      console.log('Explorer top influencers data set:', $scope.influencersData);
      finish();
    });

    // Query 2 - load 'overall' scores by time - using max of bucket_influencer anomaly_score.
    // TODO - is this giving us the results we want?
    mlResultsService.getBucketInfluencerMaxScoreByTime($scope.indexPatternId, selectedJobIds,
      bounds.min.valueOf(), bounds.max.valueOf(), $scope.swimlaneBucketInterval.expression)
    .then(function (resp) {
      processOverallResults(resp.results);
      console.log('Explorer overall swimlane data set:', $scope.overallSwimlaneData);
      finish();
    });

    $scope.loadAnomaliesTable([], bounds.min.valueOf(), bounds.max.valueOf());

  };

  $scope.loadViewBySwimlane = function () {
    // finish() function, called after each data set has been loaded and processed.
    // The last one to call it will trigger the page render.
    function finish() {
      console.log('Explorer view by swimlane data set:', $scope.viewBySwimlaneData);
      // Fire event to indicate swimlane data has changed.
      // Need to use $timeout to ensure this happens after the child scope is updated with the new data.
      $timeout(function () {
        mlExplorerDashboardService.fireSwimlaneDataChanged('viewBy');
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
      .then(function (resp) {
        // TODO - sort the influencers keys so that the partition field(s) are first.
        processViewByResults(resp.results);
        finish();
      });
    }
  };

  $scope.loadAnomaliesTable = function (influencers, earliestMs, latestMs) {
    const selectedJobIds = $scope.getSelectedJobIds();

    mlResultsService.getRecordsForInfluencer($scope.indexPatternId, selectedJobIds, influencers,
      0, earliestMs, latestMs, 500)
    .then(function (resp) {
      // Sort in descending time order before storing in scope.
      $scope.anomalyRecords = _.chain(resp.records).sortBy(function (record) { return record[$scope.timeFieldName]; }).reverse().value();
      console.log('Explorer anomalies table data set:', $scope.anomalyRecords);

      // Need to use $timeout to ensure the broadcast happens after the child scope is updated with the new data.
      $timeout(function () {
        $scope.$broadcast('renderTable');
      }, 0);
    });
  };

  $scope.loadAnomalyCharts = function (influencers, earliestMs, latestMs) {
    const selectedJobIds = $scope.getSelectedJobIds();

    // Load the top anomalies (by normalized_probability) which will be diplayed in the charts.
    mlResultsService.getRecordsForInfluencer($scope.indexPatternId, selectedJobIds, influencers,
      0, earliestMs, latestMs, 50)
    .then(function (resp) {
      $scope.anomalyChartRecords = resp.records;
      console.log('Explorer anomaly charts data set:', $scope.anomalyChartRecords);

      // Need to use $timeout to ensure the broadcast happens after the child scope is updated with the new data.
      $timeout(function () {
        $scope.$broadcast('renderCharts');
      }, 0);
    });
  };

  $scope.setSelectedJobs = function (selections) {
    $scope.selectedJobs = [];
    const selectedJobIds = [];
    const selectAll = ((selections.length === 1 && selections[0] === '*') || selections.length === 0);
    _.each($scope.jobs, function (job) {
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

    $scope.loadOverallData();
    $scope.loadViewBySwimlaneOptions();

  };

  // Refresh all the data when the time range is altered.
  $scope.$listen(timefilter, 'fetch', function () {
    const bounds = timefilter.getActiveBounds();
    $scope.loadOverallData();
    $scope.loadViewBySwimlane();
    $scope.loadAnomaliesTable([], bounds.min.valueOf(), bounds.max.valueOf());
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
  mlExplorerDashboardService.onSwimlaneCellClick(function (cellData) {
    const influencers = [];
    if (cellData.fieldName !== undefined) {
      influencers.push({ fieldName: $scope.swimlaneViewByFieldName, fieldValue: cellData.laneLabel });
    }

    const bounds = timefilter.getActiveBounds();
    const earliestMs = cellData.time !== undefined ? cellData.time * 1000 : bounds.min.valueOf();
    const latestMs = cellData.time !== undefined ? ((cellData.time  + cellData.interval) * 1000) - 1 : bounds.max.valueOf();

    $scope.loadAnomaliesTable(influencers, earliestMs, latestMs);
    $scope.loadAnomalyCharts(influencers, earliestMs, latestMs);
  });


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
