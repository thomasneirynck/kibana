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

import _ from 'lodash';
// import moment from 'moment-timezone';
// import stringUtils from 'plugins/ml/util/string_utils';
// import 'plugins/ml/lib/minify.json';
import 'ui/courier';

// import 'plugins/kibana/visualize/saved_visualizations/saved_visualizations';
// import 'ui/directives/saved_object_finder';
// import 'ui/directives/paginated_selectable_list';
// import 'plugins/kibana/discover/saved_searches/saved_searches';

// import 'plugins/ml/services/visualization_job_service';
import 'plugins/kibana/visualize/styles/main.less';
import AggTypesIndexProvider from 'ui/agg_types/index';

import dateMath from '@elastic/datemath';
import moment from 'moment-timezone';
import chrome from 'ui/chrome';
import angular from 'angular';
// /Users/james/dev/kibana-5.0/src/core_plugins/kibana/public/visualize/styles/main.less

import uiRoutes from 'ui/routes';
uiRoutes
.when('/jobs/new_job_simple/create', {
  template: require('./create_job.html'),
  resolve: {
    indexPatternIds: (courier) => courier.indexPatterns.getIds()
  }
});

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module
.controller('MlCreateSimpleJob', function (
  $scope,
  $route,
  $location,
  $filter,
  $q,
  $window,
  courier,
  timefilter,
  Private,
  mlJobService,
  mlSimpleJobService,
  mlMessageBarService,
  mlESMappingService,
  mlBrowserDetectService) {

  timefilter.enabled = true;
  const msgs = mlMessageBarService;
  const MlTimeBuckets = Private(require('plugins/ml/util/ml_time_buckets'));
  const filterAggTypes = require('plugins/ml/jobs/components/new_job_simple/create_job/filter_agg_types');

  const aggTypes = Private(AggTypesIndexProvider);
  $scope.groupName = 'metrics';
  $scope.courier = courier;

  $scope.index = $route.current.params.index;
  $scope.chartData = mlSimpleJobService.chartData;

  const PAGE_WIDTH = angular.element('.jobs-container').width();
  const BAR_TARGET = PAGE_WIDTH / 2;
  const MAX_BARS = BAR_TARGET + (BAR_TARGET / 100) * 100; // 100% larger that bar target
  const REFRESH_INTERVAL_MS = 100;
  const MAX_BUCKET_DIFF = 3;

  const JOB_STATE = {
    NOT_STARTED: 0,
    RUNNING: 1,
    FINISHED: 2,
    STOPPING: 3
  };

  let refreshCounter = 0;

  $scope.JOB_STATE = JOB_STATE;
  $scope.jobState = $scope.JOB_STATE.NOT_STARTED;

  $scope.ui = {
    showJobInput: false,
    showJobFinished: false,
    dirty: true,
    formValid: false,
    bucketSpanValid: true,
    aggTypeOptions: filterAggTypes(aggTypes.byType[$scope.groupName]),
    fields: [],
    timeFields: [],
    intervals: [{
      title: 'Auto',
      value: 'auto',
      /*enabled: function (agg) {
        // not only do we need a time field, but the selected field needs
        // to be the time field. (see #3028)
        return agg.fieldIsTimeField();
      }*/
    }, {
      title: 'Millisecond',
      value: 'ms'
    }, {
      title: 'Second',
      value: 's'
    }, {
      title: 'Minute',
      value: 'm'
    }, {
      title: 'Hourly',
      value: 'h'
    }, {
      title: 'Daily',
      value: 'd'
    }, {
      title: 'Weekly',
      value: 'w'
    }, {
      title: 'Monthly',
      value: 'M'
    }, {
      title: 'Yearly',
      value: 'y'
    }, {
      title: 'Custom',
      value: 'custom'
    }]
  };

  $scope.img1 = chrome.getBasePath() + '/plugins/ml/jobs/components/new_job_simple/img/results_1.png';
  $scope.img2 = chrome.getBasePath() + '/plugins/ml/jobs/components/new_job_simple/img/results_2.png';
  $scope.img3 = chrome.getBasePath() + '/plugins/ml/jobs/components/new_job_simple/img/results_3.png';

  $scope.formConfig = {
    agg: {
      type: undefined
    },
    field: null,
    bucketSpan: '5m',
    jobInterval: new MlTimeBuckets(),
    chartInterval: undefined,
    start: 0,
    end: 0,
    timeField: undefined,
    indexPattern: undefined,
    jobId: undefined,
    description: undefined,
    mappingTypes: []
  };

  $scope.aggChange = function () {
    loadFields();
    loadTimeFields();
    $scope.ui.isFormValid();
    $scope.ui.dirty = true;
    mlESMappingService.getMappings()
    .then((r) => {
    });
  };

  $scope.fieldChange = function () {
    let fieldName = '';

    if ($scope.formConfig.field === null) {
      // if the field name is blank, e.g. using count, use the time field to guess the mapping type
      fieldName = $scope.indexPattern.timeFieldName;
    } else {
      fieldName = $scope.formConfig.field.displayName;
    }

    $scope.ui.isFormValid();
    $scope.ui.dirty = true;
  };

  $scope.timeFieldChange = function () {
    $scope.ui.isFormValid();
    $scope.ui.dirty = true;
  };

  function setTime() {
    $scope.ui.bucketSpanValid = true;
    $scope.formConfig.start = dateMath.parse(timefilter.time.from).unix() * 1000;
    $scope.formConfig.end = dateMath.parse(timefilter.time.to).unix() * 1000;
    $scope.formConfig.format = 'epoch_millis';
    try {
      $scope.formConfig.jobInterval.setInterval($scope.formConfig.bucketSpan);
    } catch (e) {
      $scope.ui.bucketSpanValid = false;
    }

    const bounds = timefilter.getActiveBounds();
    $scope.formConfig.chartInterval = new MlTimeBuckets();
    $scope.formConfig.chartInterval.setBarTarget(BAR_TARGET);
    $scope.formConfig.chartInterval.setMaxBars(MAX_BARS);
    $scope.formConfig.chartInterval.setInterval('auto');
    $scope.formConfig.chartInterval.setBounds(bounds);

    adjustIntervalDisplayed($scope.formConfig.chartInterval);

    $scope.ui.isFormValid();
    $scope.ui.dirty = true;
  }

  // ensure the displayed interval is never smaller than the bucketSpan
  // otherwise the model debug bounds can be drawn in the wrong place.
  // this only really affects small jobs when using sum
  function adjustIntervalDisplayed(interval) {
    let makeTheSame = false;
    let secs = interval.getInterval().asSeconds();
    const bucketSpan = $scope.formConfig.jobInterval.getInterval().asSeconds();

    if (bucketSpan > secs) {
      makeTheSame = true;
    }

    if ($scope.formConfig.agg.type !== undefined) {
      const mlName = $scope.formConfig.agg.type.mlName;
      if (mlName === 'count' ||
        mlName === 'low_count' ||
        mlName === 'high_count' ||
        mlName === 'distinct_count') {
        makeTheSame = true;
      }
    }

    if (makeTheSame) {
      interval.setInterval(bucketSpan + 's');
    }
  }

  function loadFields() {
    const type = $scope.formConfig.agg.type;
    let fields = [];
    type.params.forEach((param, i) => {
      if (param.name === 'field') {
        fields = getIndexedFields(param);
      }
    });
    $scope.ui.fields = fields;

    if ($scope.ui.fields.length === 1) {
      $scope.formConfig.field = $scope.ui.fields[0];
    }
  }

  function loadTimeFields() {
    $scope.ui.timeFields = mlSimpleJobService.getTimeFields($scope.indexPattern);
    if ($scope.ui.timeFields.length === 1) {
      $scope.formConfig.timeField = $scope.ui.timeFields[0];
    }
  }

  function getIndexedFields(param) {
    let fields = _.filter($scope.indexPattern.fields.raw, 'aggregatable');
    const fieldTypes = param.filterFieldTypes;

    if (fieldTypes) {
      fields = $filter('fieldType')(fields, fieldTypes);
      fields = $filter('orderBy')(fields, ['type', 'name']);
      fields = _.filter(fields, (f) => f.displayName !== '_type');
    }
    return fields;
  }

  $scope.ui.isFormValid = function () {
    if ($scope.formConfig.agg.type === undefined ||
        // $scope.formConfig.field === undefined ||
        $scope.formConfig.timeField === undefined ||
        $scope.formConfig.jobInterval === undefined /*||
        $scope.ui.bucketSpanValid === false*/) {

      $scope.ui.formValid = false;
    } else {
      $scope.ui.formValid = true;
    }
    return $scope.ui.formValid;
  };

  $scope.loadVis = function () {
    setTime();
    $scope.ui.isFormValid();

    if ($scope.ui.formValid) {

      $scope.ui.showJobInput = true;
      $scope.ui.showJobFinished = false;

      $scope.formConfig.indexPattern = $scope.indexPattern;
      // $scope.formConfig.jobId = '';
      $scope.ui.dirty = false;

      mlSimpleJobService.getLineChartResults($scope.formConfig)
      .then((results) => {
        // console.log('chart results', results);
        $scope.hasResults = true;
        $scope.$broadcast('render');
      });
    }
  };
/*
  function createVisJson() {
    let visJson = {
      '_source': {
        'visState': {
          'title': 'New Visualization',
          'type': 'line',
          'params': {
            'shareYAxis': true,
            'addTooltip': true,
            'addLegend': true,
            'legendPosition': 'right',
            'showCircles': true,
            'smoothLines': false,
            'interpolate': 'linear',
            'scale': 'linear',
            'drawLinesBetweenPoints': true,
            'radiusRatio': 9,
            'times': [],
            'addTimeMarker': false,
            'defaultYExtents': false,
            'setYExtents': false,
            'yAxis': {}
          },
          'aggs': [
            {
              'id': '1',
              'enabled': true,
              'type': $scope.formConfig.agg.type,
              'schema': 'metric',
              'params': {
                'field': $scope.formConfig.field
              }
            },
            {
              'id': '2',
              'enabled': true,
              'type': 'date_histogram',
              'schema': 'segment',
              'params': {
                'field': $scope.formConfig.timeField,
                'interval': 'auto',
                'customInterval': $scope.formConfig.interval,
                'min_doc_count': 1,
                'extended_bounds': {}
              }
            }
          ],
          'listeners': {}
        }
      }
    };
    return visJson;
  }
  */

  // force job ids to be lowercase
  $scope.changeJobIDCase = function () {
    if ($scope.formConfig.jobId) {
      $scope.formConfig.jobId = $scope.formConfig.jobId.toLowerCase();
    }
  };

  let ignoreModel = false;
  let refreshInterval = REFRESH_INTERVAL_MS;
  // function for creating a new job.
  // creates the job, opens it, creates the scheduler and starts it.
  // the job may fail to open, but the scheduler should still be created
  // if the job save was successful.
  $scope.createJob = function () {
    if ($scope.formConfig.jobId !== '') {
      msgs.clear();
      $scope.formConfig.mappingTypes = mlESMappingService.getTypesFromMapping($scope.formConfig.indexPattern.id);
      // create the new job
      mlSimpleJobService.createJob($scope.formConfig)
      .then((job) => {
        // if save was successful, open the job
        mlJobService.openJob(job.job_id)
        .then((resp) => {
          // if open was successful create a new scheduler
          saveNewScheduler(job, true);
        })
        .catch((resp) => {
          msgs.error('Could not open job: ', resp);
          msgs.error('Job created, creating scheduler anyway');
          // if open failed, still attempt to create the scheduler
          // as it may have failed because we've hit the limit of open jobs
          saveNewScheduler(job, false);
        });

      })
      .catch((resp) => {
        // save failed
        msgs.error('Save failed: ', resp.resp);
      });
    }

    // save new scheduler internal function
    // creates a new scheduler and attempts to start it depending
    // on startSchedulerAfterSave flag
    function saveNewScheduler(job, startSchedulerAfterSave) {
      mlJobService.saveNewScheduler(job.scheduler_config, job.job_id)
      .then((resp) => {

        if (startSchedulerAfterSave) {
          mlSimpleJobService.startScheduler($scope.formConfig)
          .then((resp) => {
            $scope.jobState = JOB_STATE.RUNNING;
            refreshCounter = 0;
            ignoreModel = false;
            refreshInterval = REFRESH_INTERVAL_MS;
            loadCharts();
          })
          .catch((resp) => {
            // scheduler failed
            msgs.error('Could not start scheduler: ', resp);
          });
        }
      })
      .catch((resp) => {
        msgs.error('Save scheduler failed: ', resp)
      });
    }
  };

  function loadCharts() {
    let forceStop = false;
    // the percentage doesn't always reach 100, so periodically check the scheduler status
    // to see if the scheduler has stopped
    const counterLimit = 20 - (refreshInterval / REFRESH_INTERVAL_MS);
    if (refreshCounter >=  counterLimit) {
      refreshCounter = 0;
      mlSimpleJobService.checkSchedulerStatus($scope.formConfig)
      .then((status) => {
        if (status === 'STOPPED') {
          console.log('Stopping poll because scheduler status is: ' + status);
          $scope.$broadcast('render-results');
          forceStop = true;
        }
        run();
      });
    } else {
      run();
    }

    function run() {
      refreshCounter++;
      reloadSwimlane()
      .then((resp) => {
        if (forceStop === false && $scope.chartData.percentComplete < 100) {
          // if state has been set to stopping (from the stop button), leave state as it is
          if ($scope.jobState === JOB_STATE.STOPPING) {
            $scope.jobState = JOB_STATE.STOPPING;
          } else {
            // otherwise assume the job is running
            $scope.jobState = JOB_STATE.RUNNING;
          }
        } else {
          $scope.jobState = JOB_STATE.FINISHED;
        }

        if (ignoreModel) {
          jobCheck();
        } else {
          reloadModelChart()
          .catch(() => {
            // on the 10th model load failure, set ignoreNodel to true to stop trying to load it.
            if (refreshCounter % 10 === 0) {
              console.log('Model has failed to load 10 times. Stop trying to load it.');
              ignoreModel = true;
            }
          })
          .finally(() => {
            jobCheck();
          });
        }
      });
    }
  }

  function jobCheck() {
    if ($scope.jobState === JOB_STATE.RUNNING || $scope.jobState === JOB_STATE.STOPPING) {
      refreshInterval = adjustRefreshInterval($scope.chartData.loadingDifference, refreshInterval);
      // console.log('loading difference', $scope.chartData.loadingDifference);
      // console.log('refreshInterval', refreshInterval);
      _.delay(loadCharts, refreshInterval);
    } else {
      $scope.chartData.percentComplete = 100;
    }
    $scope.$broadcast('render-results');
  }

  function reloadModelChart() {
    return mlSimpleJobService.loadModelData($scope.formConfig);
  };


  function reloadSwimlane() {
    return mlSimpleJobService.loadSwimlaneData($scope.formConfig);
  };

  function adjustRefreshInterval(loadingDifference, currentInterval) {
    const INTERVAL_INCREASE_MS = 100;
    const MAX_INTERVAL = 10000;
    let interval = currentInterval;

    if (interval < MAX_INTERVAL) {
      if (loadingDifference < MAX_BUCKET_DIFF) {
        interval = interval + INTERVAL_INCREASE_MS;
      } else {
        if ((interval - INTERVAL_INCREASE_MS) >= REFRESH_INTERVAL_MS) {
          interval = interval - INTERVAL_INCREASE_MS;
        }
      }
    }
    return interval;
  }

  $scope.setFullTimeRange = function () {
    mlSimpleJobService.indexTimeRange($scope.indexPattern)
    .then((resp) => {
      timefilter.time.from = moment(resp.start.epoch).toISOString();
      timefilter.time.to = moment(resp.end.epoch).toISOString();
    });
  };

  $scope.resetJob = function () {
    $scope.jobState = JOB_STATE.NOT_STARTED;
    $scope.ui.showJobInput = true;
    $scope.loadVis();
  };

  $scope.stopJob = function () {
    // setting the status to STOPPING disables the stop button
    // job.scheduler_status = 'STOPPING';
    $scope.jobState = JOB_STATE.STOPPING;
    mlSimpleJobService.stopScheduler($scope.formConfig);
  };

  $scope.viewResults = function (page) {
    viewResults({id: $scope.formConfig.jobId}, page);
  };

  function viewResults(job, page) {
    if (job && page) {
      // get the time range first
      mlJobService.jobTimeRange(job.id)
        .then((resp) => {
          // if no times are found, use last 24hrs to now
          const from = (resp.start.string) ? '\'' + resp.start.string + '\'' : 'now-24h';
          const to = (resp.end.string) ?  '\'' + resp.end.string + '\'' : 'now';

          let path = chrome.getBasePath();
          path += '/app/ml#/' + page;
          path += '?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:' + from;
          path += ',mode:absolute,to:' + to;
          path += '))&_a=(filters:!(),query:(query_string:(analyze_wildcard:!t,query:\'*\')))&jobId=' + job.id;

          // in safari, window.open does not work unless it has
          // been fired from an onclick event.
          // we can't used onclick for these buttons as they need
          // to contain angular expressions
          // therefore in safari we just redirect the page using location.href
          if (mlBrowserDetectService() === 'safari') {
            location.href = path;
          } else {
            $window.open(path, '_blank');
          }
        }).catch(function (resp) {
          // msgs.error("Job results for "+job.job_id+" could not be opened");
        });
    }
  };

  courier.indexPatterns.get($scope.index).then((resp) => {
    $scope.indexPattern = resp;
  });

  $scope.$listen(timefilter, 'fetch', $scope.loadVis);

});