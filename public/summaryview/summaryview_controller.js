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
 * Angular controller for the Prelert summary view visualization. The controller makes
 * multiple queries to Elasticsearch to obtain the data to populate all the components
 * in the view.
 */

import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import angular from 'angular';
import uiRoutes from 'ui/routes';
import 'ui/timefilter';

import 'plugins/prelert/services/job_service';
import 'plugins/prelert/services/prelert_dashboard_service';
import 'plugins/prelert/services/results_service';

import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import stringUtils from 'plugins/prelert/util/string_utils';
import swimlanes from 'plugins/prelert/summaryview/swimlanes.html';
import chrome from 'ui/chrome';

uiRoutes
.when('/summaryview/?', {
  template: require('./summaryview.html')
});

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlSummaryViewController', function ($scope, $route, $timeout, $compile, $location, Private, $q, es, prlJobService, timefilter, globalState, prlAnomalyRecordDetailsService, prlDashboardService, prlSwimlaneSearchService, prlSwimlaneService) {

  // TODO - move the index pattern into an editor setting,
  //        or configure the visualization to use a search?
  const PRELERT_RESULTS_INDEX_ID = 'prelertresults-*';
  timefilter.enabled = true;

  const TimeBuckets = Private(require('ui/time_buckets'));

  $scope.loading = true;
  $scope.hasResults = false;

  $scope.getSelectedJobIds = function () {
    const selectedJobs = _.filter($scope.jobs, (job) => { return job.selected; });
    return _.map(selectedJobs, (job) => {return job.id;});
  };

  $scope.initializeVis = function () {
    // Load the job info needed by the visualization, then do the first load.
    prlJobService.getBasicJobInfo(PRELERT_RESULTS_INDEX_ID)
    .then((resp) => {
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
          $scope.jobs.push({id:job.id, selected: false, bucketSpan: job.bucketSpan});
        });

        $scope.setSelectedJobs(selectedJobIds);
      }

    }).catch((resp) => {
      console.log('Connections map - error getting job info from elasticsearch:', resp);
    });

  };

  $scope.refresh = function () {

    $scope.loading = true;
    $scope.hasResults = false;

    if ($scope.selectedJobs === undefined) {
      return;
    }

    // counter to keep track of what data sets have been loaded.
    let readyCount = 5;
    // finish function, called after each data set has been loaded and processed.
    // the last one to call it will trigger the page render.
    function finish() {
      readyCount--;
      if (readyCount === 0) {

        // elasticsearch may return results earlier than requested.
        // e.g. when it has decided to use 1w as the interval, it will round to the nearest week start
        // therefore we should make sure all datasets have the same earliest and so are drawn starting at the same time
        const earliest = _.min([
          $scope.jobChartData.earliest,
          $scope.detectorChartData.earliest,
          $scope.monitorChartData.earliest,
          $scope.influencerChartData.earliest,
          $scope.influencerTypeChartData.earliest,
          $scope.eventRateChartData.earliest
        ]);
        $scope.jobChartData.earliest = earliest;
        $scope.detectorChartData.earliest = earliest;
        $scope.monitorChartData.earliest = earliest;
        $scope.influencerChartData.earliest = earliest;
        $scope.influencerTypeChartData.earliest = earliest;
        $scope.eventRateChartData.earliest = earliest;
        _.each($scope.detectorPerJobChartData, (d) => {
          d.earliest = earliest;
        });

        // Tell the swimlane directives to render.
        // Need to use $timeout to ensure the broadcast happens after the child scope is updated with the new data.
        $timeout(() => {
          if ($scope.monitorChartData.points && $scope.monitorChartData.points.length) {
            $scope.hasResults = true;
            prlAnomalyRecordDetailsService.load();
            $scope.lanes = {};
            $scope.laneMarkers = [];
            $compile($('.swimlane-container').html(swimlanes))($scope);
            $scope.$broadcast('render');

            prlAnomalyRecordDetailsService.loadTopInfluencersForPage();
          } else {
            $scope.hasResults = false;
          }
          $scope.loading = false;
        }, 0);
      }
    }

    const bounds = timefilter.getActiveBounds();
    prlAnomalyRecordDetailsService.setBounds(bounds);
    const selectedJobIds = $scope.getSelectedJobIds();

    prlSwimlaneService.setTimeRange({start: (bounds.min.valueOf() / 1000), end: (bounds.max.valueOf() / 1000)});
    prlSwimlaneService.setSelectedJobIds(selectedJobIds);
    prlAnomalyRecordDetailsService.setSelectedJobIds(selectedJobIds);

    $scope.bucketInterval = calculateBucketInterval();
    prlAnomalyRecordDetailsService.setBucketInterval($scope.bucketInterval);

    // 1 - load job results
    prlSwimlaneSearchService.getScoresByBucket(PRELERT_RESULTS_INDEX_ID, selectedJobIds,
      bounds.min.valueOf(), bounds.max.valueOf(), $scope.bucketInterval.expression, 10)
    .then((resp) => {
      console.log('SummaryView bucket swimlane refresh data:', resp);

      processJobResults(resp.results);
      processMonitorResults($scope.jobChartData);

      finish();
      // call event rate load function
      loadEventRateData();

    }).catch((resp) => {
      console.log('SummaryView visualization - error getting scores by detector data from elasticsearch:', resp);
    });

    // 2 - load detector results
    prlSwimlaneSearchService.getScoresByDetector(PRELERT_RESULTS_INDEX_ID, selectedJobIds,
        bounds.min.valueOf(), bounds.max.valueOf(), $scope.bucketInterval.expression, 10)
    .then((resp)=> {
      console.log('SummaryView detector swimlane refresh data:', resp);

      processDetectorResults(resp.results);
      finish();

    }).catch((resp) => {
      console.log('SummaryView visualization - error getting scores by detector data from elasticsearch:', resp);
    });

    // 3 - load influencer type results
    prlSwimlaneSearchService.getScoresByInfluencerType(PRELERT_RESULTS_INDEX_ID, selectedJobIds,
        bounds.min.valueOf(), bounds.max.valueOf(), $scope.bucketInterval.expression, 20)
    .then((resp)=> {
      console.log('SummaryView influencer type swimlane refresh data:', resp);

      processInfluencerTypeResults(resp.results.influencerTypes);
      finish();

    }).catch((resp) => {
      console.log('SummaryView visualization - error getting scores by influencer data from elasticsearch:', resp);
    });

    // 4 - load influencer value results
    prlSwimlaneSearchService.getScoresByInfluencerValue(PRELERT_RESULTS_INDEX_ID, selectedJobIds,
      bounds.min.valueOf(), bounds.max.valueOf(), $scope.bucketInterval.expression, 20)
    .then((resp) => {
      console.log('SummaryView influencer value swimlane refresh data:', resp);

      processInfluencerResults(resp.results.influencerValues);
      finish();

    }).catch((resp) => {
      console.log('SummaryView visualization - error getting scores by influencer data from elasticsearch:', resp);
    });


    // 5 - load event rate results
    // in it's own function because it must get called after job results have loaded.
    function loadEventRateData() {
      const gridWidth = getGridWidth();
      const numBuckets = parseInt(($scope.jobChartData.latest - $scope.jobChartData.earliest) / $scope.jobChartData.interval);
      const cellWidth = Math.floor(gridWidth / numBuckets);

      const chartWidth = cellWidth * numBuckets;
      const timeRange = bounds.max.valueOf() - bounds.min.valueOf();
      const interval = Math.floor((timeRange / chartWidth) * 3);

      $scope.chartWidth = chartWidth;

      prlSwimlaneSearchService.getEventRate(PRELERT_RESULTS_INDEX_ID, selectedJobIds,
        bounds.min.valueOf(), bounds.max.valueOf(), (interval + 'ms'), 500)
      .then(function (resp) {
        console.log('SummaryView event rate refresh data:', resp);

        processEventRateResults(resp.results);
        finish();

      }).catch(function (resp) {
        console.log('SummaryView visualization - error getting event rate data from elasticsearch:', resp);
      });
    }

  };

  function calculateBucketInterval() {
    // Bucketing interval should be the maximum of the chart related interval (i.e. time range related)
    // and the max bucket span for the jobs shown in the chart.
    const bounds = timefilter.getActiveBounds();
    const buckets = new TimeBuckets();
    buckets.setInterval('auto');
    buckets.setBounds(bounds);
    console.log('calculateBucketInterval() buckets interval:', buckets.getInterval());

    const selectedJobs = _.filter($scope.jobs, job => job.selected);
    console.log('calculateBucketInterval() selectedJobs:', selectedJobs);

    const intervalSeconds = buckets.getInterval().asSeconds();

    // if the swimlane cell widths are too small they will not be visible
    // calculate how many buckets will be drawn before the swimlanes are actually rendered
    // and increase the interval to widen the cells if they're going to be smaller than 8px
    // this has to be done at this stage so all searches use the same interval
    const numBuckets = parseInt(((bounds.max.valueOf() - bounds.min.valueOf()) / 1000) / intervalSeconds);
    const gridWidth = getGridWidth();
    const cellWidth = Math.floor(gridWidth / numBuckets);

    // if the cell width is going to be less than 8px, double the interval
    if (cellWidth < 8) {
      buckets.setInterval((intervalSeconds * 2) + 's');
    }

    const maxBucketSpan = _.reduce(selectedJobs, (memo, job) => Math.max(memo, job.bucketSpan) , 0);
    if (maxBucketSpan > intervalSeconds) {
      buckets.setInterval(maxBucketSpan + 's');
      buckets.setBounds(bounds);
    }

    return buckets.getInterval();
  }

  function getGridWidth() {
    // grid width is 3 quarters of of the window, minus 170 for the lane labels, minus 50 padding
    return (($('.prl-summary-view').width() / 4) * 3) - 170 - 50;
  }

  function processJobResults(dataByJob) {
    const dataset = {'laneLabels':[], 'points':[]};
    const timeObjs = {};

    prlSwimlaneSearchService.calculateBounds(dataset, $scope.bucketInterval.asSeconds());

    // Use job ids as lane labels.
    _.each(dataByJob, (jobData, jobId) => {
      dataset.laneLabels.push(jobId);

      _.each(jobData, (normProb, timeMs) => {
        const time = timeMs / 1000;
        dataset.points.push({'laneLabel':jobId, 'time': time, 'value': normProb});

        if (time < dataset.earliest) {
          dataset.earliest = time;
        }

        if (timeObjs[time] === undefined) {
          timeObjs[time] = {};
        }
      });
    });

    let times = Object.keys(timeObjs);
    times = times.sort();

    prlAnomalyRecordDetailsService.clearTimes();
    prlAnomalyRecordDetailsService.setTimes(times);

    console.log('SummaryView jobs swimlane dataset:', dataset);
    $scope.jobChartData = dataset;
  }

  function processDetectorResults(dataByJob) {
    const dataset = {'laneLabels':[], 'points':[]};
    const datasetPerJob = {};

    prlSwimlaneSearchService.calculateBounds(dataset, $scope.bucketInterval.asSeconds());

    // clone the basic dataset for each job
    _.each(dataByJob, (jobData, jobId) => {
      datasetPerJob[jobId] = angular.copy(dataset, datasetPerJob[jobId]);
    });

    // Get the descriptions of the detectors to use as lane labels.
    _.each(dataByJob, (jobData, jobId) => {
      _.each(jobData, (detectorData, detectorIndex) => {
        const detectorDesc = prlJobService.detectorsByJob[jobId][detectorIndex].detector_description;
        // If a duplicate detector description has been used across jobs append job ID.
        const laneLabel = _.indexOf(dataset.laneLabels, detectorDesc) === -1 ?
            detectorDesc : detectorDesc + ' (' + jobId + ')';
        dataset.laneLabels.push(laneLabel);
        datasetPerJob[jobId].laneLabels.push(laneLabel);

        _.each(detectorData, (normProb, timeMs) => {
          const time = timeMs / 1000;
          dataset.points.push({'laneLabel':laneLabel, 'time': time, 'value': normProb});
          datasetPerJob[jobId].points.push({'laneLabel':laneLabel, 'time': time, 'value': normProb});

          if (time < dataset.earliest) {
            dataset.earliest = time;
          }
        });
      });
    });

    console.log('SummaryView detector swimlane dataset:', dataset);
    $scope.detectorChartData = dataset;
    $scope.detectorPerJobChartData = datasetPerJob;
  }

  function processMonitorResults(jobChartData) {
    const dataset = {
      laneLabels:['All jobs'],
      points:[],
      earliest: jobChartData.earliest,
      latest: jobChartData.latest,
      interval: jobChartData.interval
    };

    const points = jobChartData.points;
    const maxScoresPerBucket = {};

    _.each(points, (point) => {
      if (maxScoresPerBucket[point.time] === undefined) {
        maxScoresPerBucket[point.time] = 0;
      }
      if (point.value > maxScoresPerBucket[point.time]) {
        maxScoresPerBucket[point.time] = point.value;
      }
    });

    _.each(maxScoresPerBucket, (bucket, time) => {
      dataset.points.push({
        laneLabel: 'All jobs',
        time: +time,
        value: bucket
      });
    });

    console.log('SummaryView monitor swimlane dataset:', dataset);
    $scope.monitorChartData = dataset;
  }


  function processInfluencerResults(dataByInfluencer) {
    const dataset = {'laneLabels':[], 'points':[]};

    prlSwimlaneSearchService.calculateBounds(dataset, $scope.bucketInterval.asSeconds());

    _.each(dataByInfluencer, (influencerData, influencerFieldValue) => {
      dataset.laneLabels.push(influencerFieldValue);

      _.each(influencerData, (anomalyScore, timeMs) => {
        const time = timeMs / 1000;
        dataset.points.push({'laneLabel':influencerFieldValue, 'time': time, 'value': anomalyScore});

        if (time < dataset.earliest) {
          dataset.earliest = time;
        }
      });
    });
    console.log('SummaryView influencer swimlane dataset:', dataset);
    $scope.influencerChartData = dataset;
  }

  function processInfluencerTypeResults(dataByInfluencerType) {
    const dataset = {'laneLabels':[], 'points':[]};

    prlSwimlaneSearchService.calculateBounds(dataset, $scope.bucketInterval.asSeconds());

    _.each(dataByInfluencerType, (influencerData, influencerFieldType) => {
      dataset.laneLabels.push(influencerFieldType);

      _.each(influencerData, (anomalyScore, timeMs) => {
        const time = timeMs / 1000;
        dataset.points.push({'laneLabel':influencerFieldType, 'time': time, 'value': anomalyScore});

        if (time < dataset.earliest) {
          dataset.earliest = time;
        }
      });
    });

    console.log('SummaryView influencer swimlane dataset:', dataset);
    $scope.influencerTypeChartData = dataset;
  }

  function processEventRateResults(data) {
    const dataset = {'laneLabels':[], 'points':[]};

    prlSwimlaneSearchService.calculateBounds(dataset, $scope.bucketInterval.asSeconds());

    const maximums = {};
    $scope.eventRateChartData = {};
    const times = {};
    _.each(data, (job, jobId) => {
      let max = 0;
      _.each(job, (val, time) => {
        times[time] = null;
        if (val > max) {
          max = val;
        }
      });
      maximums[jobId] = max;
    });
    $scope.eventRateChartData.max = maximums;
    $scope.eventRateChartData.data = data;
    $scope.eventRateChartData.times = Object.keys(times).sort();
    $scope.eventRateChartData.times = $scope.eventRateChartData.times.map((i) => {return +i;});
    $scope.eventRateChartData.times.pop();

    $scope.eventRateChartData.earliest = dataset.earliest;
    $scope.eventRateChartData.latest = dataset.latest;
    $scope.eventRateChartData.interval = dataset.interval;

    const evTimes = $scope.eventRateChartData.times;
    // pad out times either side of the earliest and latest
    if ((dataset.latest - dataset.earliest) / dataset.interval !== evTimes.length) {
      const evInterval = evTimes[1] - evTimes[0];
      if (dataset.earliest < evTimes[0]) {
        while (dataset.earliest < evTimes[0]) {
          evTimes.splice(0, 0, (evTimes[0] - evInterval));
        }
      }

      if ((dataset.latest - dataset.interval) > evTimes[evTimes.length - 1]) {
        while ((dataset.latest - dataset.interval) > evTimes[evTimes.length - 1]) {
          evTimes.push((evTimes[evTimes.length - 1] + evInterval));
        }
      }
    }
  }


  // Refresh the data when the time range is altered.
  $scope.$listen(timefilter, 'fetch', $scope.refresh);

  // When inside a dashboard in the Prelert plugin, listen for changes to job selection.
  prlDashboardService.listenJobSelectionChange($scope, (event, selections) => {
    $scope.setSelectedJobs(selections);
  });

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
    $scope.unsafeHtml = '<prl-job-select-list selected="' + selectedJobIds.join(' ') + '"></prl-job-select-list>';

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
    $scope.refresh();
  };

  $scope.initializeVis();
  $scope.$emit('application.load');
})
.service('prlSwimlaneService', function ($window, prlJobService, prlBrowserDetectService) {
  let selectedJobIds = [];
  let timeRange = {start:0, end:0};

  this.setSelectedJobIds = function (ids) {
    selectedJobIds = ids;
  };

  this.setTimeRange = function (tr) {
    timeRange = tr;
  };

  this.openExplorer = function (tr) {
    openPage('anomalyexplorer', tr);
  };

  this.openConnections = function (tr) {
    openPage('connections', tr);
  };

  function openPage(page, tr) {
    tr = tr || timeRange;
    const from = moment(tr.start * 1000).toISOString();
    const to = moment(tr.end * 1000).toISOString();

    const jobString = selectedJobIds.join('&jobId=');

    let path = chrome.getBasePath() + '/app/prelert#/' + page;
    path += '?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:\'' + from;
    path += '\',mode:absolute,to:\'' + to;
    path += '\'))&_a=(filters:!(),query:(query_string:(analyze_wildcard:!t,query:\'*\')))&jobId=' + jobString;

    if (prlBrowserDetectService() === 'safari') {
      location.href = path;
    } else {
      $window.open(path, '_blank');
    }
  }
});


