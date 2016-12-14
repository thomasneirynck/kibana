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
import $ from 'jquery';
import stringUtils from 'plugins/prelert/util/string_utils';
import anomalyUtils from 'plugins/prelert/util/anomaly_utils';
import _ from 'lodash';

import uiModules from 'ui/modules';
let module = uiModules.get('apps/prelert');

module.directive('prlSwimlaneInspector', function ($location, $window, prlSwimlaneInspectorService, prlSwimlaneSelectionService, prlSwimlaneService) {
  return {
    restrict: 'AE',
    replace: false,
    scope: {},
    template: require('plugins/prelert/summaryview/swimlane_inspector/swimlane_inspector.html'),
    link: function ($scope, $element, $attrs) {
      $scope.controls = prlSwimlaneInspectorService.controls;
      $scope.controls.scope = $scope;

      $scope.chartData = prlSwimlaneInspectorService.chartData;

      $scope.lanes = {};
      $scope.laneMarkers = [];

      $scope.applyZoom = function () {
        prlSwimlaneInspectorService.hide();
        prlSwimlaneInspectorService.applyZoom();
      };

      $scope.openExplorer = function () {
        prlSwimlaneService.openExplorer(prlSwimlaneInspectorService.getTimeRange());
      };

      $scope.openConnections = function () {
        prlSwimlaneService.openConnections(prlSwimlaneInspectorService.getTimeRange());
      };

      $scope.close = function () {
        prlSwimlaneInspectorService.hide();
        prlSwimlaneSelectionService.hide();
      };

    },
  };
})
.service('prlSwimlaneInspectorService', function ($q, $timeout, $rootScope, $compile, es, Private, timefilter, prlJobService, prlAnomalyRecordDetailsService, prlSwimlaneSearchService) {
  const TimeBuckets = Private(require('ui/time_buckets'));

  const swimlanesHTML = require('plugins/prelert/summaryview/swimlane_inspector/swimlanes.html');

  const PRELERT_RESULTS_INDEX_ID = 'prelertresults-*';

  let id = '';
  const controls = {
    visible: false,
    top: 0,
    left: 0,
    width: 900,
    arrowLeft: '50%',
    inspectorChartData: {},
    topInfluencerList: {},
    showTopInfluencerList: false,
    scope: null,
    labels: {
      laneLabel: '',
      start: '',
      end: ''
    },
  };
  this.controls = controls;
  let laneLabel = '';
  let swimlaneType = '';
  let timeRange = {};
  let $swimlanes;
  let $lane;
  let selectedJobIds;
  let times = [];

  this.getSwimlaneType = function () {
    return swimlaneType;
  };
  this.getTimeRange = function () {
    return timeRange;
  };
  this.getSelectedJobIds = function () {
    return selectedJobIds;
  };

  this.show = function (timeRangeIn, laneLabelIn, $laneIn, $target, swimlaneTypeIn, selectedJobIdsIn) {
    $swimlanes = $('#swimlane-inspector .swimlanes');
    $swimlanes.empty();

    laneLabel = laneLabelIn;
    swimlaneType = swimlaneTypeIn;
    timeRange = timeRangeIn;
    $lane = $laneIn;
    selectedJobIds = selectedJobIdsIn;

    controls.labels.laneLabel = prlJobService.jobDescriptions[laneLabel];
    controls.labels.start = moment.unix(timeRange.start).format('MMM DD HH:mm');
    controls.labels.end = moment.unix(timeRange.end).format('MMM DD HH:mm');

    controls.visible = true;
    position($target);
    loadSwimlane();
    loadTopInfluencersForRange();
  };

  this.hide = function () {
    // if clicking on a card outside of the inspector, unlock any locked cards in the inspector
    // before the inspector closes
    if (controls.visible && prlAnomalyRecordDetailsService.isLocked()) {
      prlAnomalyRecordDetailsService.toggleLock(false);
    }
    controls.visible = false;
    id = '';
  };

  this.applyZoom = function () {
    timefilter.time.from = moment(timeRange.start * 1000).toISOString();
    timefilter.time.to = moment(timeRange.end * 1000).toISOString();
  };

  function position($target) {
    const pos = $target.position();
    const width = $target.width();
    const bubbleMarginWidth = $('.prl-anomaly-details-margin').width();
    const appWidth = $('.application').width();

    const selection = {
      top: pos.top,
      left: pos.left,
      width: width,
      center: pos.left + (width / 2)
    };
    controls.top = selection.top + 20;
    controls.left = selection.center - (controls.width / 2);

    const leftBorder = 8;
    const rightBorder = bubbleMarginWidth + 8;
    if (controls.left < leftBorder) {

      controls.left = leftBorder;
      controls.arrowLeft = selection.center - leftBorder + 'px';

    } else if ((controls.left + controls.width) > (appWidth - rightBorder)) {

      controls.left = appWidth - controls.width - rightBorder;
      const diff = (appWidth - rightBorder) - (controls.left + controls.width);
      controls.arrowLeft = selection.center - controls.left  + diff + 'px';

    } else {
      controls.arrowLeft = '50%';
    }
  }

  function loadSwimlane() {
    const type = prlAnomalyRecordDetailsService.type[swimlaneType];
    const types = prlAnomalyRecordDetailsService.type;
    let interval = calculateBucketInterval();

    let recordJobIds;

    function fin() {
      prlAnomalyRecordDetailsService.setTimes(times);
      prlAnomalyRecordDetailsService.createInspectorRecords(swimlaneType, recordJobIds, timeRange, times);
    }

    if (type === types.MONITOR) {
      // MONITOR
      recordJobIds = selectedJobIds;
      loadResults(prlSwimlaneSearchService.getScoresByBucket, recordJobIds, interval, (results) => {
        processJobResults(results, laneLabel);
        processMonitorResults(controls.inspectorChartData);
        fin();
      });
    } else if (type === types.JOB) {
      // JOB
      const job = prlJobService.basicJobs[laneLabel];
      interval = calculateBucketInterval(job.bucketSpan);

      recordJobIds = [laneLabel];
      loadResults(prlSwimlaneSearchService.getScoresByBucket, recordJobIds, interval, (results) => {
        processJobResults(results, laneLabel);
        fin();
      });
    } else if (type === types.DETECTOR) {
      // DETECTOR
      recordJobIds = selectedJobIds;
      const job = prlJobService.basicJobs[recordJobIds[0]];
      interval = calculateBucketInterval(job.bucketSpan);

      loadResults(prlSwimlaneSearchService.getScoresByDetector, recordJobIds, interval, (results) => {
        processDetectorResults(results, laneLabel);
        fin();
      });
    } else if (type === types.INF_TYPE) {
      // INFLUENCER TYPE
      recordJobIds = selectedJobIds;
      loadResults(prlSwimlaneSearchService.getScoresByInfluencerType, recordJobIds, interval, (results) => {
        processInfluencerResults(results.influencerTypes, laneLabel);
        fin();
      });
    } else if (type === types.INF_VALUE) {
      // INFLUENCER TYPE
      recordJobIds = selectedJobIds;
      loadResults(prlSwimlaneSearchService.getScoresByInfluencerValue, recordJobIds, interval, (results) => {
        processInfluencerResults(results.influencerValues, laneLabel);
        fin();
      });
    }

  }

  function loadResults(func, jobIds, interval, callback) {

    func(PRELERT_RESULTS_INDEX_ID, jobIds,
      (timeRange.start * 1000), (timeRange.end * 1000), interval.expression, 10)
    .then((resp) => {
      console.log('Swimlane inspector data:', resp);

      callback(resp.results);
      displaySwimlane();

    }).catch((resp) => {
      console.log('Swimlane inspector  - error getting scores by influencer data from elasticsearch:', resp);
    });
  }

  function displaySwimlane() {
    $timeout(() => {
      controls.scope.lanes = {};
      controls.scope.laneMarkers = [];
      $compile($swimlanes.html(swimlanesHTML))(controls.scope);
      controls.scope.$broadcast('render');
    }, 0);
  }

  function processMonitorResults(jobChartData) {
    const dataset = {
      laneLabels:['Monitor'],
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
        laneLabel: 'Monitor',
        time: +time,
        value: bucket
      });
    });

    console.log('SummaryView monitor swimlane dataset:', dataset);
    controls.inspectorChartData = dataset;
  }

  function processJobResults(dataByJob) {
    const dataset = {'laneLabels':[], 'points':[]};
    const timeObjs = {};

    const bounds = {
      min: moment(timeRange.start * 1000),
      max: moment(timeRange.end * 1000)
    };
    prlSwimlaneSearchService.calculateBounds(dataset, timeRange.interval, bounds);

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
    times = Object.keys(timeObjs);
    times = times.sort();

    console.log('SummaryView jobs swimlane dataset:', dataset);
    controls.inspectorChartData = dataset;
  }


  function processDetectorResults(dataByJob, laneLabel) {
    const dataset = {'laneLabels':[], 'points':[]};
    const timeObjs = {};

    const bounds = {
      min: moment(timeRange.start * 1000),
      max: moment(timeRange.end * 1000)
    };

    prlSwimlaneSearchService.calculateBounds(dataset, timeRange.interval, bounds);

    // Get the descriptions of the detectors to use as lane labels.
    _.each(dataByJob, (jobData, jobId) => {
      _.each(jobData, (detectorData, detectorIndex) => {
        const detectorDesc = prlJobService.detectorsByJob[jobId][detectorIndex].detectorDescription;
        // If a duplicate detector description has been used across jobs append job ID.
        const ll = _.indexOf(dataset.laneLabels, detectorDesc) === -1 ?
            detectorDesc : detectorDesc + ' (' + jobId + ')';
        if (ll === laneLabel) {
          dataset.laneLabels.push(laneLabel);

          _.each(detectorData, (normProb, timeMs) => {
            const time = timeMs / 1000;
            dataset.points.push({'laneLabel':laneLabel, 'time': time, 'value': normProb});

            if (time < dataset.earliest) {
              dataset.earliest = time;
            }
            if (timeObjs[time] === undefined) {
              timeObjs[time] = {};
            }
          });
        }
      });
    });

    times = Object.keys(timeObjs);
    times = times.sort();
    console.log('SummaryView detector swimlane dataset:', dataset);
    controls.inspectorChartData = dataset;
  }

  function processInfluencerTypeResults(dataByInfluencerType, laneLabel) {
    const dataset = {'laneLabels':[], 'points':[]};
    const timeObjs = {};

    const bounds = {
      min: moment(timeRange.start * 1000),
      max: moment(timeRange.end * 1000)
    };
    prlSwimlaneSearchService.calculateBounds(dataset, timeRange.interval, bounds);

    _.each(dataByInfluencerType, (influencerData, influencerFieldType) => {
      if (influencerFieldType === laneLabel) {
        dataset.laneLabels.push(influencerFieldType);

        _.each(influencerData, (anomalyScore, timeMs) => {
          const time = timeMs / 1000;
          dataset.points.push({'laneLabel':influencerFieldType, 'time': time, 'value': anomalyScore});

          if (time < dataset.earliest) {
            dataset.earliest = time;
          }
          if (timeObjs[time] === undefined) {
            timeObjs[time] = {};
          }
        });
      }
    });

    times = Object.keys(timeObjs);
    times = times.sort();
    console.log('SummaryView influencer swimlane dataset:', dataset);
    controls.inspectorChartData = dataset;
  }

  function processInfluencerResults(dataByInfluencer) {
    const dataset = {'laneLabels':[], 'points':[]};
    const timeObjs = {};

    const bounds = {
      min: moment(timeRange.start * 1000),
      max: moment(timeRange.end * 1000)
    };
    prlSwimlaneSearchService.calculateBounds(dataset, timeRange.interval, bounds);

    _.each(dataByInfluencer, (influencerData, influencerFieldValue) => {
      if (influencerFieldValue === laneLabel) {
        dataset.laneLabels.push(influencerFieldValue);

        _.each(influencerData, (anomalyScore, timeMs) => {
          const time = timeMs / 1000;
          dataset.points.push({'laneLabel':influencerFieldValue, 'time': time, 'value': anomalyScore});

          if (time < dataset.earliest) {
            dataset.earliest = time;
          }
          if (timeObjs[time] === undefined) {
            timeObjs[time] = {};
          }
        });
      }
    });


    times = Object.keys(timeObjs);
    times = times.sort();
    console.log('SummaryView influencer swimlane dataset:', dataset);
    controls.inspectorChartData = dataset;
  }

  function calculateBucketInterval(bucketSpan) {
    // Bucketing interval should be the maximum of the chart related interval (i.e. time range related)
    // and the max bucket span for the jobs shown in the chart.
    // const bounds = timefilter.getActiveBounds();
    const bounds = {
      min: moment(timeRange.start * 1000),
      max: moment(timeRange.end * 1000)
    };

    const buckets = new TimeBuckets();
    buckets.setInterval('auto');
    buckets.setBounds(bounds);

    if (timeRange.interval > buckets.getInterval().asSeconds()) {
      timeRange.interval = buckets.getInterval().asSeconds();
    }
    if (bucketSpan > timeRange.interval) {
      timeRange.interval = bucketSpan;
      buckets.setInterval(timeRange.interval + 's');
    }

    return buckets.getInterval();
  }

  function loadTopInfluencersForRange() {
    controls.topInfluencerList = {};
    controls.showTopInfluencerList = false;

    prlSwimlaneSearchService.getTopInfluencers(PRELERT_RESULTS_INDEX_ID, laneLabel, selectedJobIds, swimlaneType,
        timeRange.start, timeRange.end, 0, prlAnomalyRecordDetailsService.type)
    .then((resp) => {

      const list = _.uniq(_.union(resp.results.topMax, resp.results.topSum), false, (item, key, id) => { return item.id; });
      controls.topInfluencerList = list;
      controls.showTopInfluencerList = Object.keys(list).length ? true : false;

    }).catch((resp) => {
      console.log('SummaryView visualization - error getting scores by influencer data from elasticsearch:', resp);
    });
  }

});
