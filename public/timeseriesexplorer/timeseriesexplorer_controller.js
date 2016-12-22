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
import uiRoutes from 'ui/routes';
import 'ui/timefilter';

import 'plugins/prelert/services/job_service';
import 'plugins/prelert/services/prelert_dashboard_service';
import 'plugins/prelert/services/results_service';

uiRoutes
.when('/timeseriesexplorer/?', {
  template: require('./timeseriesexplorer.html')
});

import uiModules from 'ui/modules';
const module = uiModules.get('apps/prelert');

module.controller('PrlTimeSeriesExplorerController', function ($scope, $route, $timeout, $compile, $location,
  Private, $q, es, timefilter, globalState, prlJobService, prlResultsService, prlDashboardService, prlTimeSeriesSearchService) {

  // TODO - move the index pattern into a setting?
  $scope.indexPatternId = '.ml-anomalies-*';
  $scope.timeFieldName = 'timestamp';
  timefilter.enabled = true;


  const CHARTS_POINT_TARGET = 500;
  const ANOMALIES_MAX_RESULTS = 500;
  const TimeBuckets = Private(require('plugins/prelert/util/prelert_time_buckets'));

  $scope.loading = true;
  $scope.hasResults = false;

  $scope.getSelectedJobIds = function () {
    const selectedJobs = _.filter($scope.jobs, function (job) { return job.selected; });
    return _.map(selectedJobs, function (job) {return job.id;});
  };

  $scope.initializeVis = function () {
    // Load the job info needed by the visualization, then do the first load.
    prlJobService.getBasicJobInfo($scope.indexPatternId)
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
          $scope.jobs.push({id:job.id, selected: false, bucketSpan: job.bucketSpan});
        });

        $scope.setSelectedJobs(selectedJobIds);
      }

    }).catch(function (resp) {
      console.log('Time series explorer - error getting job info from elasticsearch:', resp);
    });

  };

  $scope.refresh = function () {

    $scope.loading = true;
    $scope.hasResults = false;

    if ($scope.selectedJobs === undefined) {
      return;
    }

    // Counter to keep track of what data sets have been loaded.
    let awaitingCount = 2;

    // finish() function, called after each data set has been loaded and processed.
    // The last one to call it will trigger the page render.
    function finish() {
      awaitingCount--;
      if (awaitingCount === 0) {

        if ($scope.contextChartData && $scope.contextChartData.length) {
          $scope.hasResults = true;
        } else {
          $scope.hasResults = false;
        }
        $scope.loading = false;

        // Tell the results container directives to render.
        // Need to use $timeout to ensure the broadcast happens after the child scope is updated with the new data.
        if ($scope.contextChartData && $scope.contextChartData.length) {
          $timeout(function () {
            $scope.$broadcast('render');
          }, 0);
        }

      }
    }

    const bounds = timefilter.getActiveBounds();
    const selectedJobIds = $scope.getSelectedJobIds();

    // Calculate the aggregation interval for the context chart.
    // Context chart swimlane will display bucket anomaly score at the same interval.
    $scope.contextAggregationInterval = calculateAggregationInterval(bounds, CHARTS_POINT_TARGET, CHARTS_POINT_TARGET);
    console.log('aggregationInterval for context data (s):', $scope.contextAggregationInterval.asSeconds());

    // Query 1 - load model debug data at low granularity across full time range.
    prlTimeSeriesSearchService.getModelDebugOutput($scope.indexPatternId, selectedJobIds,
      bounds.min.valueOf(), bounds.max.valueOf(), $scope.contextAggregationInterval.expression)
    .then(function (resp) {
      const fullRangeChartData = processModelDebugResults(resp.results);
      $scope.contextChartData = fullRangeChartData;

      console.log('Time series explorer model debug context chart data set:', $scope.contextChartData);

      // Set zoomFrom/zoomTo attributes in scope which will result in the model debug chart automatically
      // selecting the specified range in the context chart, and so loading that date range in the focus chart.
      if ($scope.contextChartData.length) {
        const focusRange = calculateInitialFocusRange();
        $scope.zoomFrom = focusRange[0];
        $scope.zoomTo = focusRange[1];
      }

      finish();
    }).catch(function (resp) {
      console.log('Time series explorer - error getting model debug data from elasticsearch:', resp);
    });

    // Query 2 - load max anomalyScore by bucket at same granularity as context chart
    // across full time range for use in the swimlane.
    prlTimeSeriesSearchService.getScoresByBucket($scope.indexPatternId, selectedJobIds,
      bounds.min.valueOf(), bounds.max.valueOf(), $scope.contextAggregationInterval.expression)
    .then(function (resp) {
      const fullRangeBucketScoreData = processBucketScoreResults(resp.results);
      $scope.swimlaneData = fullRangeBucketScoreData;
      console.log('Time series explorer swimlane anomalies data set:', $scope.swimlaneData);

      finish();
    }).catch(function (resp) {
      console.log('Time series explorer - error getting bucket anomaly scores from elasticsearch:', resp);
    });
  };

  $scope.refreshFocusData = function (fromDate, toDate) {

    // Counter to keep track of what data sets have been loaded.
    let awaitingCount = 3;

    // finish() function, called after each data set has been loaded and processed.
    // The last one to call it will trigger the page render.
    function finish() {
      awaitingCount--;
      if (awaitingCount === 0) {

        processDataForFocusAnomalies($scope.focusChartData, $scope.focusChartBucketScoreData);
        console.log('Time series explorer focus chart data set:', $scope.focusChartData);

        // Tell the results container directives to render the focus chart.
        // Need to use $timeout to ensure the broadcast happens after the child scope is updated with the new data.
        $timeout(function () {
          if ($scope.focusChartData && $scope.focusChartData.length) {
            $scope.$broadcast('renderFocusChart');
            $scope.$broadcast('renderTable');
          } else {
            $scope.$broadcast('renderFocusChart');
            $scope.$broadcast('renderTable');
          }

          $scope.loading = false;
        }, 0);

      }
    }

    const selectedJobIds = $scope.getSelectedJobIds();

    // Calculate the aggregation interval for the focus chart.
    const bounds = {min: moment(fromDate), max: moment(toDate)};
    $scope.focusAggregationInterval = calculateAggregationInterval(bounds, CHARTS_POINT_TARGET, CHARTS_POINT_TARGET);
    console.log('aggregationInterval for focus data (s):', $scope.focusAggregationInterval.asSeconds());

    // Query 1 - load model debug data across selected time range.
    prlTimeSeriesSearchService.getModelDebugOutput($scope.indexPatternId, selectedJobIds,
      bounds.min.valueOf(), bounds.max.valueOf(), $scope.focusAggregationInterval.expression)
    .then(function (resp) {
      $scope.focusChartData = processModelDebugResults(resp.results);
      finish();
    }).catch(function (resp) {
      console.log('Time series explorer - error getting model debug data from elasticsearch:', resp);
    });

    // Query 2 - load max anomalyScore by bucket across selected time range.
    prlTimeSeriesSearchService.getScoresByBucket($scope.indexPatternId, selectedJobIds,
      bounds.min.valueOf(), bounds.max.valueOf(), $scope.focusAggregationInterval.expression)
    .then(function (resp) {
      $scope.focusChartBucketScoreData = processBucketScoreResults(resp.results);
      finish();
    }).catch(function (resp) {
      console.log('Time series explorer - error getting bucket anomaly scores from elasticsearch:', resp);
    });

    // Query 3 - load records across full time range.
    prlResultsService.getRecords($scope.indexPatternId, selectedJobIds,
      0, bounds.min.valueOf(), bounds.max.valueOf(), ANOMALIES_MAX_RESULTS)
    .then(function (resp) {
      // Sort in descending time order before storing in scope.
      $scope.anomalyRecords = _.chain(resp.records).sortBy(function (record) { return record[$scope.timeFieldName]; }).reverse().value();
      console.log('Time series explorer anomalies:', $scope.anomalyRecords);
      finish();
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

  // Refresh the data when the time range is altered.
  $scope.$listen(timefilter, 'fetch', $scope.refresh);

  // When inside a dashboard in the Prelert plugin, listen for changes to job selection.
  prlDashboardService.listenJobSelectionChange($scope, function (event, selections) {
    $scope.setSelectedJobs(selections);
  });

  $scope.$on('contextChartSelected', function (event, selection) {
    // Save state of zoom (adds to URL).
    let zoomState = { from: selection.from.toISOString(), to: selection.to.toISOString()};
    globalState.zoom = zoomState;
    globalState.save();

    $scope.zoomFrom = selection.from;
    $scope.zoomTo = selection.to;

    $scope.refreshFocusData(selection.from, selection.to);
  });

  function calculateInitialFocusRange() {
    // Get the time span of data in the context chart.
    const earliestDataDate = _.first($scope.contextChartData).date;
    const latestDataDate = _.last($scope.contextChartData).date;

    // Calculate the 'auto' zoom duration which shows data at bucket span granularity.
    // Get the minimum bucket span of selected jobs.
    // TODO - only look at jobs for which data has been returned?
    const minBucketSpan = _.reduce($scope.selectedJobs, (memo, job) => Math.min(memo, job.bucketSpan) , 86400);
    $scope.autoZoomDuration = (minBucketSpan * 1000) * (CHARTS_POINT_TARGET - 1);

    // Check for a zoom parameter in the globalState (URL).
    if (globalState.zoom !== undefined) {
      let zoomFrom = moment(globalState.zoom.from, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true);
      let zoomTo = moment(globalState.zoom.to, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true);
      if (zoomFrom.isValid() && zoomTo.isValid &&
        zoomFrom.isBetween(earliestDataDate, latestDataDate) && zoomTo.isBetween(earliestDataDate, latestDataDate)) {
        return [zoomFrom.toDate(), zoomTo.toDate()];
      }
    }

    // Set the range of the focus chart to show the most recent data at bucket span granularity.
    const latestMsToLoad = latestDataDate.getTime() + $scope.contextAggregationInterval.asMilliseconds();
    const earliestMsToLoad = Math.max(earliestDataDate.getTime(), latestMsToLoad - $scope.autoZoomDuration);
    return [new Date(earliestMsToLoad), new Date(latestMsToLoad)];

  }

  function calculateSwimlaneAggregationInterval(bounds, bucketsTarget, minCellWidth) {
    // TODO - this can go, assuming low granularity swimlane doesn't reappear.

    // If the swimlane cell widths are too small they will not be fully visible.
    // Calculate how many buckets will be drawn before the swimlanes are actually
    // rendered and increase the interval to widen the cells if they're going to
    // be smaller than the supplied minimum.

    // Use width of top level container as the swimlane div will not initially be rendered.
    // Remove 50px for padding.
    // Max bars for the aggregation is 10% greater than the bar target
    const swimlaneWidth = $('.prl-time-series-explorer').width() - 50;
    const cellWidthForMaxBars = Math.floor(swimlaneWidth / (bucketsTarget * 1.1));
    const target = (cellWidthForMaxBars >= minCellWidth ? (bucketsTarget * 1.1) : (Math.ceil(swimlaneWidth / minCellWidth)));
    return calculateAggregationInterval(bounds, target);
  }

  function calculateAggregationInterval(bounds, bucketsTarget) {
    // Aggregation interval used in queries should be a function of the time span of the chart
    // and the bucket span of the selected job(s).
    const barTarget = (bucketsTarget !== undefined ? bucketsTarget : 100);
    // Use a maxBars of 10% greater than the target.
    const maxBars = Math.floor(1.1 * barTarget);
    let buckets = new TimeBuckets();
    buckets.setInterval('auto');
    buckets.setBounds(bounds);
    buckets.setBarTarget(Math.floor(barTarget));
    buckets.setMaxBars(maxBars);
    let aggInterval = buckets.getInterval();

    // Set the interval back to the job bucket span if the auto interval is smaller.
    const minJobBucketSpan = _.reduce($scope.selectedJobs, (memo, job) => Math.min(memo, job.bucketSpan) , 86400);
    const secs = aggInterval.asSeconds();
    if (secs < minJobBucketSpan) {
      buckets.setInterval(minJobBucketSpan + 's');
      aggInterval = buckets.getInterval();
    }

    console.log('calculateAggregationInterval() barTarget,maxBars,returning:', bucketsTarget, maxBars,
      (bounds.max.diff(bounds.min)) / aggInterval.asMilliseconds());

    return aggInterval;
  }

  function processModelDebugResults(modelDebugData) {
    // Return dataset in format used by the model debug chart.
    // i.e. array of Objects with keys date (JavaScript date), value, lower and upper.
    let modelDebugChartData = [];
    _.each(modelDebugData, function (dataForTime, time) {
      modelDebugChartData.push(
        {
          date: new Date(+time),
          lower: dataForTime.debugLower,
          value: dataForTime.actual,
          upper: dataForTime.debugUpper
        });
    });

    return modelDebugChartData;
  }

  function processBucketScoreResults(scoreData) {
    // Return dataset in format used by the swimlane.
    // i.e. array of Objects with keys date (JavaScript date) and score.
    let bucketScoreData = [];
    _.each(scoreData, function (dataForTime, time) {
      bucketScoreData.push(
        {
          date: new Date(+time),
          score: dataForTime.anomalyScore,
        });
    });

    return bucketScoreData;
  }

  function processDataForFocusAnomalies(chartData, anomalyScoreData) {
    // Combine the data from the two sets to add anomalyScore properties
    // to the chartData entries for anomalous buckets.
    _.each(anomalyScoreData, function (bucket) {
      if (bucket.score > 0) {
        // Assume bucket times match in each data set for the majority of cases.
        // If not (e.g. interim results?) need to find closest time in chartData set.
        const bucketTime = bucket.date.getTime();
        let chartPoint;
        for (let i = 0; i < chartData.length; i++) {
          if (chartData[i].date.getTime() === bucketTime) {
            chartPoint = chartData[i];
            break;
          }
        }

        if (chartPoint === undefined) {
          // Find nearest point in time.
          // loop through line items until the date is greater than bucketTime
          // grab the current and prevous items in the and compare the time differences
          let foundItem;
          for (let i = 0; i < chartData.length; i++) {
            const itemTime = chartData[i].date.getTime();
            if (itemTime > bucketTime) {
              const item = chartData[i];
              const prevousItem = chartData[i - 1];

              const diff1 = Math.abs(bucketTime - prevousItem.date.getTime());
              const diff2 = Math.abs(bucketTime - itemTime);

              // foundItem should be the item with a date closest to bucketTime
              if (prevousItem === undefined || diff1 > diff2) {
                foundItem = item;
              } else {
                foundItem = prevousItem;
              }
              break;
            }
          }

          chartPoint = foundItem;
        }

        if (chartPoint !== undefined) {
          chartPoint.anomalyScore = bucket.score;
        } else {
          // Bucket data (anomalyScoreData) may have an extra point than model debug data (chartData),
          // e.g. right at the end of a job. In this case set the score for the last chart point to
          // that of the last bucket, if that bucket has a higher score.
          const lastChartPoint = chartData[chartData.length - 1];
          const lastChartPointScore = lastChartPoint.anomalyScore || 0;
          lastChartPoint.anomalyScore = Math.max(lastChartPointScore, bucket.score);
        }
      }
    });
  }

  $scope.initializeVis();

});
