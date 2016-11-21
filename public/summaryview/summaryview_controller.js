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
 * Angular controller for the Prelert summary view visualization. The controller makes
 * multiple queries to Elasticsearch to obtain the data to populate all the components
 * in the view.
 */

import _ from 'lodash';
import $ from 'jquery';
import moment from 'moment';
import uiRoutes from 'ui/routes';
import 'ui/timefilter';

import 'plugins/prelert/services/job_service';
import 'plugins/prelert/services/prelert_dashboard_service';
import 'plugins/prelert/services/results_service';

import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import stringUtils from 'plugins/prelert/util/string_utils';
import swimlanes from "plugins/prelert/summaryview/swimlanes.html";
import chrome from 'ui/chrome';

uiRoutes
.when('/summaryview/?', {
  template: require('./summaryview.html')
});

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.controller('PrlSummaryViewController', function($scope, $route, $timeout, $compile, $location, Private, $q, es, prlJobService, timefilter, globalState, prlAnomalyRecordDetailsService, prlDashboardService, prlSwimlaneSearchService, prlSwimlaneService) {

  // TODO - move the index pattern into an editor setting,
  //        or configure the visualization to use a search?
  var PRELERT_RESULTS_INDEX_ID = 'prelertresults-*';
  timefilter.enabled = true;

  var TimeBuckets = Private(require('ui/time_buckets'));

  $scope.loading = true;
  $scope.hasResults = false;

  $scope.getSelectedJobIds = function() {
    var selectedJobs = _.filter($scope.jobs, function(job){ return job.selected; });
    return _.map(selectedJobs, function(job){return job.id;});
  };

  $scope.initializeVis = function() {
    // Load the job info needed by the visualization, then do the first load.
    prlJobService.getBasicJobInfo(PRELERT_RESULTS_INDEX_ID)
    .then(function(resp) {
      if (resp.jobs.length > 0) {
        // Set any jobs passed in the URL as selected, otherwise check any saved in the Vis.
        var selectedJobIds = [];
        var urlSearch = $location.search();
        if (_.has(urlSearch, 'jobId')) {
          var jobIdParam = urlSearch.jobId;
          if (_.isArray(jobIdParam) === true) {
              selectedJobIds = jobIdParam;
          } else {
              selectedJobIds = [jobIdParam];
          }
        } else {
          selectedJobIds = $scope.getSelectedJobIds();
        }

        $scope.jobs = [];
        _.each(resp.jobs, function(job){
          $scope.jobs.push({id:job.id, selected: false, bucketSpan: job.bucketSpan});
        });

        $scope.setSelectedJobs(selectedJobIds);
      }

    }).catch(function(resp) {
      console.log("Connections map - error getting job info from elasticsearch:", resp);
    });

  };

  $scope.refresh = function() {

    $scope.loading = true;
    $scope.hasResults = false;

    if($scope.selectedJobs === undefined) {
      return;
    }

    // counter to keep track of what data sets have been loaded.
    var readyCount = 5;
    // finish function, called after each data set has been loaded and processed.
    // the last one to call it will trigger the page render.
    function finish() {
      readyCount--;
      if(readyCount === 0) {
        $scope.selectedJobIds = selectedJobIds;

        // elasticsearch may return results earlier than requested.
        // e.g. when it has decided to use 1w as the interval, it will round to the nearest week start
        // therefore we should make sure all datasets have the same earliest and so are drawn starting at the same time
        var earliest = _.min([
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
        _.each($scope.detectorPerJobChartData, function(d) {
          d.earliest = earliest;
        });

        // Tell the swimlane directives to render.
        // Need to use $timeout to ensure the broadcast happens after the child scope is updated with the new data.
        $timeout(function(){
          if($scope.monitorChartData.points && $scope.monitorChartData.points.length) {
            $scope.hasResults = true;
            prlAnomalyRecordDetailsService.load();
            $scope.lanes = {};
            $scope.laneMarkers = [];
            $compile($(".swimlane-container").html(swimlanes))($scope);
            $scope.$broadcast('render');

            prlAnomalyRecordDetailsService.loadTopInfluencersForPage();
          } else {
            $scope.hasResults = false;
          }
          $scope.loading = false;
        }, 0);
      }
    }

    var bounds = timefilter.getActiveBounds();
    prlAnomalyRecordDetailsService.setBounds(bounds);
    var selectedJobIds = $scope.getSelectedJobIds();

    prlSwimlaneService.setTimeRange({start: (bounds.min.valueOf()/1000), end: (bounds.max.valueOf()/1000)});
    prlSwimlaneService.setSelectedJobIds(selectedJobIds);
    prlAnomalyRecordDetailsService.setSelectedJobIds(selectedJobIds);

    $scope.bucketInterval = calculateBucketInterval();
    prlAnomalyRecordDetailsService.setBucketInterval($scope.bucketInterval);

    // 1 - load job results
    prlSwimlaneSearchService.getScoresByBucket(PRELERT_RESULTS_INDEX_ID, selectedJobIds,
      bounds.min.valueOf(), bounds.max.valueOf(), $scope.bucketInterval.expression, 10)
    .then(function(resp){
      console.log("SummaryView bucket swimlane refresh data:", resp);

      processJobResults(resp.results);
      processMonitorResults($scope.jobChartData);

      finish();
      // call event rate load function
      loadEventRateData();

      }).catch(function(resp) {
      console.log("SummaryView visualization - error getting scores by detector data from elasticsearch:", resp);
    });

    // 2 - load detector results
    prlSwimlaneSearchService.getScoresByDetector(PRELERT_RESULTS_INDEX_ID, selectedJobIds,
        bounds.min.valueOf(), bounds.max.valueOf(), $scope.bucketInterval.expression, 10)
    .then(function(resp){
      console.log("SummaryView detector swimlane refresh data:", resp);

      processDetectorResults(resp.results);
      finish();

      }).catch(function(resp) {
      console.log("SummaryView visualization - error getting scores by detector data from elasticsearch:", resp);
    });

    // 3 - load influencer type results
    prlSwimlaneSearchService.getScoresByInfluencerType(PRELERT_RESULTS_INDEX_ID, selectedJobIds,
        bounds.min.valueOf(), bounds.max.valueOf(), $scope.bucketInterval.expression, 20)
    .then(function(resp){
      console.log("SummaryView influencer type swimlane refresh data:", resp);

      processInfluencerTypeResults(resp.results.influencerTypes);
      finish();

      }).catch(function(resp) {
      console.log("SummaryView visualization - error getting scores by influencer data from elasticsearch:", resp);
    });

    // 4 - load influencer value results
    prlSwimlaneSearchService.getScoresByInfluencerValue(PRELERT_RESULTS_INDEX_ID, selectedJobIds,
      bounds.min.valueOf(), bounds.max.valueOf(), $scope.bucketInterval.expression, 20)
    .then(function(resp){
      console.log("SummaryView influencer value swimlane refresh data:", resp);

      processInfluencerResults(resp.results.influencerValues);
      finish();

      }).catch(function(resp) {
      console.log("SummaryView visualization - error getting scores by influencer data from elasticsearch:", resp);
    });


    // 5 - load event rate results
    // in it's own function because it must get called after job results have loaded.
    function loadEventRateData() {
      // grid with is 3 quarters of of the window, minus 170 for the lane labels, minus 50 padding
      var gridWidth = (($(".prl-summary-view").width()/4)*3) - 170 - 50;
      var numBuckets = parseInt(($scope.jobChartData.latest-$scope.jobChartData.earliest)/$scope.jobChartData.interval);
      var cellWidth = Math.floor(gridWidth / numBuckets);

      var chartWidth = cellWidth * numBuckets;
      var timeRange = bounds.max.valueOf() - bounds.min.valueOf();
      var interval = Math.floor((timeRange/chartWidth)*3);

      $scope.chartWidth = chartWidth;

      prlSwimlaneSearchService.getEventRate(PRELERT_RESULTS_INDEX_ID, selectedJobIds,
        bounds.min.valueOf(), bounds.max.valueOf(), (interval+"ms"), 500)
      .then(function(resp){
        console.log("SummaryView event rate refresh data:", resp);

        processEventRateResults(resp.results);
        finish();

      }).catch(function(resp) {
        console.log("SummaryView visualization - error getting event rate data from elasticsearch:", resp);
      });
    }

  };


  function calculateBucketInterval() {
    // Bucketing interval should be the maximum of the chart related interval (i.e. time range related)
    // and the max bucket span for the jobs shown in the chart.
    var bounds = timefilter.getActiveBounds();
    var buckets = new TimeBuckets();
    buckets.setInterval('auto');
    buckets.setBounds(bounds);
    console.log("calculateBucketInterval() buckets interval:", buckets.getInterval());

    var selectedJobs = _.filter($scope.jobs, function(job){ return job.selected; });
    // var selectedJobs = _.filter($scope.vis.params.jobs, function(job){ return job.selected; });
    console.log("calculateBucketInterval() selectedJobs:", selectedJobs);
    var maxBucketSpan = _.reduce(selectedJobs, function(memo, job){
      // console.log("memo,job", memo, job);
      return Math.max(memo, job.bucketSpan);
    }, 0);
    if (maxBucketSpan > buckets.getInterval().asSeconds()) {
      buckets.setInterval(maxBucketSpan + 's');
      buckets.setBounds(bounds);
    }

    return buckets.getInterval();
  }

  function processJobResults(dataByJob) {
    var dataset = {'laneLabels':[], 'points':[]};
    var timeObjs = {};

    prlSwimlaneSearchService.calculateBounds(dataset, $scope.bucketInterval.asSeconds());

    // Use job ids as lane labels.
    _.each(dataByJob, function(jobData, jobId){
      dataset.laneLabels.push(jobId);

      _.each(jobData, function(normProb, timeMs){
        var time = timeMs/1000;
        dataset.points.push({'laneLabel':jobId, 'time': time, 'value': normProb});

        if(time < dataset.earliest) {
          dataset.earliest = time;
        }

        if(timeObjs[time] === undefined) {
          timeObjs[time] = {};
        }
      });
    });

    var times = Object.keys(timeObjs);
    times = times.sort();

    prlAnomalyRecordDetailsService.clearTimes();
    prlAnomalyRecordDetailsService.setTimes(times);

    console.log("SummaryView jobs swimlane dataset:", dataset);
    $scope.jobChartData = dataset;
  }

  function processDetectorResults(dataByJob) {
    var dataset = {'laneLabels':[], 'points':[]};
    var datasetPerJob = {};

    prlSwimlaneSearchService.calculateBounds(dataset, $scope.bucketInterval.asSeconds());

    // clone the basic dataset for each job
    _.each(dataByJob, function(jobData, jobId){
      datasetPerJob[jobId] = angular.copy(dataset, datasetPerJob[jobId]);
    });

    // Get the descriptions of the detectors to use as lane labels.
    _.each(dataByJob, function(jobData, jobId){
      _.each(jobData, function(detectorData, detectorIndex){
        var detectorDesc = prlJobService.detectorsByJob[jobId][detectorIndex].detectorDescription;
        // If a duplicate detector description has been used across jobs append job ID.
        var laneLabel = _.indexOf(dataset.laneLabels, detectorDesc) == -1 ?
            detectorDesc : detectorDesc + ' (' + jobId + ')';
        dataset.laneLabels.push(laneLabel);
        datasetPerJob[jobId].laneLabels.push(laneLabel);

        _.each(detectorData, function(normProb, timeMs){
          var time = timeMs/1000;
          dataset.points.push({'laneLabel':laneLabel, 'time': time, 'value': normProb});
          datasetPerJob[jobId].points.push({'laneLabel':laneLabel, 'time': time, 'value': normProb});

          if(time < dataset.earliest) {
            dataset.earliest = time;
          }
        });
      });
    });

    console.log("SummaryView detector swimlane dataset:", dataset);
    $scope.detectorChartData = dataset;
    $scope.detectorPerJobChartData = datasetPerJob;
  }

  function processMonitorResults(jobChartData) {
    var dataset = {
      laneLabels:['All jobs'],
      points:[],
      earliest: jobChartData.earliest,
      latest: jobChartData.latest,
      interval: jobChartData.interval
    };

    var points = jobChartData.points;
    var maxScoresPerBucket = {};

    _.each(points, function(point){
      if(maxScoresPerBucket[point.time] === undefined) {
        maxScoresPerBucket[point.time] = 0;
      }
      if(point.value > maxScoresPerBucket[point.time]) {
        maxScoresPerBucket[point.time] = point.value;
      }
    });

    _.each(maxScoresPerBucket, function(bucket, time) {
      dataset.points.push({
        laneLabel: "All jobs",
        time: +time,
        value: bucket
      });
    });

    console.log("SummaryView monitor swimlane dataset:", dataset);
    $scope.monitorChartData = dataset;
  }


  function processInfluencerResults(dataByInfluencer) {
    var dataset = {'laneLabels':[], 'points':[]};

    prlSwimlaneSearchService.calculateBounds(dataset, $scope.bucketInterval.asSeconds());

    _.each(dataByInfluencer, function(influencerData, influencerFieldValue){
      dataset.laneLabels.push(influencerFieldValue);

      _.each(influencerData, function(anomalyScore, timeMs){
        var time = timeMs/1000;
        dataset.points.push({'laneLabel':influencerFieldValue, 'time': time, 'value': anomalyScore});

        if(time < dataset.earliest) {
          dataset.earliest = time;
        }
      });
    });
    console.log("SummaryView influencer swimlane dataset:", dataset);
    $scope.influencerChartData = dataset;
  }

  function processInfluencerTypeResults(dataByInfluencerType) {
    var dataset = {'laneLabels':[], 'points':[]};

    prlSwimlaneSearchService.calculateBounds(dataset, $scope.bucketInterval.asSeconds());

    _.each(dataByInfluencerType, function(influencerData, influencerFieldType){
      dataset.laneLabels.push(influencerFieldType);

      _.each(influencerData, function(anomalyScore, timeMs){
        var time = timeMs/1000;
        dataset.points.push({'laneLabel':influencerFieldType, 'time': time, 'value': anomalyScore});

        if(time < dataset.earliest) {
          dataset.earliest = time;
        }
      });
    });

    console.log("SummaryView influencer swimlane dataset:", dataset);
    $scope.influencerTypeChartData = dataset;
  }

  function processEventRateResults(data) {
    var dataset = {'laneLabels':[], 'points':[]};

    prlSwimlaneSearchService.calculateBounds(dataset, $scope.bucketInterval.asSeconds());

    var maximums = {};
    $scope.eventRateChartData = {};
    var times = {};
    _.each(data, function(job, jobId) {
      var max = 0;
      _.each(job, function(val, time) {
        times[time] = null;
        if(val > max) {
          max = val;
        }
      });
      maximums[jobId] = max;
    });
    $scope.eventRateChartData.max = maximums;
    $scope.eventRateChartData.data = data;
    $scope.eventRateChartData.times = Object.keys(times).sort();
    $scope.eventRateChartData.times = $scope.eventRateChartData.times.map(function(i) {return +i;});
    $scope.eventRateChartData.times.pop();

    $scope.eventRateChartData.earliest = dataset.earliest;
    $scope.eventRateChartData.latest = dataset.latest;
    $scope.eventRateChartData.interval = dataset.interval;

    var evTimes = $scope.eventRateChartData.times;
    // pad out times either side of the earliest and latest
    if( (dataset.latest-dataset.earliest)/dataset.interval !== evTimes.length) {
      var evInterval = evTimes[1] - evTimes[0];
      if(dataset.earliest < evTimes[0]) {
        while(dataset.earliest < evTimes[0]) {
          evTimes.splice(0, 0, (evTimes[0] - evInterval));
        }
      }

      if((dataset.latest - dataset.interval) > evTimes[evTimes.length-1]) {
        while((dataset.latest - dataset.interval) > evTimes[evTimes.length-1]) {
          evTimes.push((evTimes[evTimes.length-1] + evInterval));
        }
      }
    }
  }


  // Refresh the data when the time range is altered.
  $scope.$listen(timefilter, 'fetch', $scope.refresh);

  // When inside a dashboard in the Prelert plugin, listen for changes to job selection.
  prlDashboardService.listenJobSelectionChange($scope, function(event, selections){
    $scope.setSelectedJobs(selections);
  });

  $scope.setSelectedJobs = function(selections) {
    $scope.selectedJobs = [];
    var selectedJobIds = [];
    var selectAll = ((selections.length === 1 && selections[0] === '*') || selections.length === 0);
    _.each($scope.jobs, function(job){
      job.selected = (selectAll || _.indexOf(selections, job.id) !== -1);
      if(job.selected) {
        $scope.selectedJobs.push(job);
        selectedJobIds.push(job.id);
      }
    });

    // Build scope objects used in the HTML template.
    $scope.unsafeHtml = '<prl-job-select-list selected="' + selectedJobIds.join(' ') + '"></prl-job-select-list>';

    // Crop long job IDs for display in the button text.
    // The first full job ID is displayed in the tooltip.
    var firstJobId = selectedJobIds[0];
    if (selectedJobIds.length > 1 && firstJobId.length > 22) {
      firstJobId = firstJobId.substring(0, 19) + "...";
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
.service("prlSwimlaneService", function($window, prlJobService, prlBrowserDetectService) {
  // var that = this;
  var selectedJobIds = [];
  var timeRange = {start:0, end:0};

  this.setSelectedJobIds = function(ids){
    selectedJobIds = ids;
  };

  this.setTimeRange = function(tr){
    timeRange = tr;
  };

  this.openExplorer = function(tr) {
    openPage("anomalyexplorer", tr);
  };

  this.openConnections = function(tr) {
    openPage("connections", tr);
  };

  function openPage(page, tr) {
    tr = tr || timeRange;
    var from = moment(tr.start*1000).toISOString();
    var to = moment(tr.end*1000).toISOString();

    var jobString = selectedJobIds.join("&jobId=");

    var path = chrome.getBasePath() + "/app/prelert#/"+page+"?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:'"+from+"',mode:absolute,to:'"+to+"'))&_a=(filters:!(),query:(query_string:(analyze_wildcard:!t,query:'*')))&jobId="+jobString;

    if(prlBrowserDetectService() === "safari") {
      location.href = path;
    } else {
      $window.open(path, '_blank');
    }
  }
});


