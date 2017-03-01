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
import 'ui/courier';

import 'plugins/kibana/visualize/styles/main.less';
import AggTypesIndexProvider from 'ui/agg_types/index';

import dateMath from '@elastic/datemath';
import moment from 'moment';
import chrome from 'ui/chrome';
import angular from 'angular';

import uiRoutes from 'ui/routes';
import checkLicense from 'plugins/ml/license/check_license';

uiRoutes
.defaults(/dashboard/, {
  requireDefaultIndex: true
})
.when('/jobs/new_job_multi_metric/create', {
  template: require('./create_job.html'),
  resolve: {
    CheckLicense: checkLicense,
    indexPattern: (courier, $route) => courier.indexPatterns.get($route.current.params.index),
    savedSearch: (courier, $route, savedSearches) => savedSearches.get($route.current.params.savedSearchId)
  }
});

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module
.controller('MlCreateMultiMetricJob', function (
  $scope,
  $route,
  $location,
  $filter,
  $window,
  courier,
  timefilter,
  Private,
  mlJobService,
  mlMultiMetricJobService,
  mlMessageBarService,
  mlESMappingService,
  mlBrowserDetectService) {

  timefilter.enabled = true;
  const msgs = mlMessageBarService;
  const MlTimeBuckets = Private(require('plugins/ml/util/ml_time_buckets'));
  const filterAggTypes = require('plugins/ml/jobs/components/new_job_single_metric/create_job/filter_agg_types');

  const aggTypes = Private(AggTypesIndexProvider);
  $scope.groupName = 'metrics';
  $scope.courier = courier;

  mlMultiMetricJobService.clearChartData();
  $scope.chartData = mlMultiMetricJobService.chartData;

  const PAGE_WIDTH = angular.element('.multi-metric-job-container').width();
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

  let indexPattern = $route.current.locals.indexPattern;
  let query = {
    query_string: {
      analyze_wildcard: true,
      query: '*'
    }
  };
  const savedSearch = $route.current.locals.savedSearch;
  const searchSource = savedSearch.searchSource;

  let pageTitle = `index pattern ${indexPattern.id}`;

  if (indexPattern.id === undefined &&
    savedSearch.id !== undefined) {
    indexPattern = searchSource.get('index');
    query = searchSource.get('query');

    pageTitle = `saved search ${savedSearch.title}`;
  }

  $scope.ui = {
    indexPatternId: indexPattern.id,
    pageTitle: pageTitle,
    showJobInput: true,
    showJobFinished: false,
    dirty: false,
    formValid: false,
    bucketSpanValid: true,
    aggTypeOptions: filterAggTypes(aggTypes.byType[$scope.groupName]),
    fields: [],
    splitFields: [],
    timeFields: [],
    splitText: '',
    tickedFieldsCount:0,
    wizard: {
      step: 0,
      forward: function () {
        wizardStep(1);
      },
      back: function () {
        wizardStep(-1);
      },
    },
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

  $scope.formConfig = {
    agg: {
      type: undefined
    },
    field: null,
    fields: {},
    bucketSpan: '5m',
    jobInterval: new MlTimeBuckets(),
    chartInterval: undefined,
    start: 0,
    end: 0,
    timeField: indexPattern.timeFieldName,
    splitField: '--No split--',
    keyFields: {},
    firstSplitFieldValue: undefined,
    indexPattern: indexPattern,
    query: query,
    jobId: undefined,
    description: undefined,
    mappingTypes: []
  };

  $scope.formChange = function () {
    $scope.ui.isFormValid();
    $scope.ui.dirty = true;

    $scope.loadVis();
  };

  $scope.splitChange = function () {
    const splitField = $scope.formConfig.splitField;
    $scope.formConfig.firstSplitFieldValue = undefined;

    if (splitField !== '--No split--') {
      $scope.formConfig.keyFields[splitField] = splitField;

      $scope.ui.splitText = 'Data split by ' + splitField;

      mlMultiMetricJobService.getSplitFields($scope.formConfig, 10)
      .then((resp) => {
        if (resp.results.values && resp.results.values.length) {
          $scope.formConfig.firstSplitFieldValue = resp.results.values[0];
        }

        drawCards(resp.results.values);
        $scope.formChange();
      });
    } else {
      $scope.ui.splitText = '';
      destroyCards();
      $scope.formChange();
    }
  };

  function wizardStep(step) {
    $scope.ui.wizard.step += step;
  }

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
    const secs = interval.getInterval().asSeconds();
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

  function initAgg() {
    _.each($scope.ui.aggTypeOptions, (agg) => {
      if (agg.title === 'Average') {
        $scope.formConfig.agg.type = agg;
      }
    });
  }

  function loadFields() {
    const type = $scope.formConfig.agg.type;
    let fields = [];
    let categoryFields = [];
    $scope.ui.fields = [];
    type.params.forEach((param) => {
      if (param.name === 'field') {
        fields = getIndexedFields(param, 'number');
      }
      if (param.name === 'customLabel') {
        categoryFields = getIndexedFields(param, ['string', 'ip']);
      }
    });

    _.each(fields, (field) => {
      $scope.ui.fields.push({id: field.displayName, agg: {type: $scope.formConfig.agg.type}});
    });

    _.each(categoryFields, (field) => {
      if (field.displayName !== 'type') {
        $scope.ui.splitFields.push(field.displayName);
      }
    });

    if ($scope.ui.fields.length === 1) {
      $scope.formConfig.field = $scope.ui.fields[0];
    }
  }

  $scope.toggleFields = function (key, field) {
    const f = $scope.formConfig.fields[key];
    if (f === undefined) {
      $scope.formConfig.fields[key] = field;
    } else {
      delete $scope.formConfig.fields[key];
    }

    $scope.ui.tickedFieldsCount = Object.keys($scope.formConfig.fields).length;
  };

  $scope.toggleKeyFields = function (key) {
    const f = $scope.formConfig.keyFields[key];
    if (f === undefined) {
      $scope.formConfig.keyFields[key] = key;
    } else {
      delete $scope.formConfig.keyFields[key];
    }
  };

  function getIndexedFields(param, fieldTypes) {
    let fields = _.filter(indexPattern.fields.raw, 'aggregatable');
    // const fieldTypes = param.filterFieldTypes;

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
        $scope.formConfig.jobInterval === undefined ||
        /*$scope.ui.bucketSpanValid === false*/
        Object.keys($scope.formConfig.fields).length === 0) {

      $scope.ui.formValid = false;
    } else {
      $scope.ui.formValid = true;
    }
    return $scope.ui.formValid;
  };

  $scope.loadVis = function () {
    setTime();
    $scope.ui.isFormValid();

    $scope.ui.showJobInput = true;
    $scope.ui.showJobFinished = false;

    $scope.ui.dirty = false;

    mlMultiMetricJobService.clearChartData();

    if (Object.keys($scope.formConfig.fields).length) {
      mlMultiMetricJobService.getLineChartResults($scope.formConfig)
      .then(() => {
        loadDocCountData();
      });
    } else {
      loadDocCountData();
    }

    function loadDocCountData() {
      const gridWidth = angular.element('.charts-container').width();
      mlMultiMetricJobService.loadDocCountData($scope.formConfig, gridWidth)
      .then(() => {
        $scope.hasResults = true;
        $scope.$broadcast('render');
      });
    }
  };

  function drawCards(labels) {
    const splitField = $scope.formConfig.splitField;

    const $frontCard = angular.element('.multi-metric-job-container .detector-container .card-front');
    $frontCard.addClass('card');
    $frontCard.find('.card-title').text(splitField + ': ' + labels[0]);
    const w = $frontCard.width();
    // const h = $frontCard.height();

    angular.element('.card-behind').remove();

    for (let i = 0; i < labels.length; i++) {
      let el = '<div class="card card-behind"><div class="card-title">';
      el += splitField + ': ' + labels[i];
      el += '</div></div>';

      const $backCard = angular.element(el);
      $backCard.css('width', w);
      $backCard.css('height', 100);
      $backCard.css('display', 'auto');
      $backCard.css('z-index', (9 - i));

      $backCard.insertBefore($frontCard);
    }

    const cardsBehind = angular.element('.card-behind');
    let marginTop = 54;
    let marginLeft = 0;
    let backWidth = w;

    for (let i = 0; i < cardsBehind.length; i++) {
      cardsBehind[i].style.marginTop = marginTop + 'px';
      cardsBehind[i].style.marginLeft = marginLeft + 'px';
      cardsBehind[i].style.width = backWidth + 'px';

      marginTop -= (10 - (i * (10 / labels.length))) * (10 / labels.length);
      marginLeft += (5 - (i / 2));
      backWidth -= (5 - (i / 2)) * 2;
    }
    let i = 0;
    function fadeCard() {
      if (i < cardsBehind.length) {
        cardsBehind[i].style.opacity = 1;
        window.setTimeout(fadeCard , 40);
        i++;
      }
    }
    fadeCard();
  }

  function destroyCards() {
    angular.element('.card-behind').remove();

    const $frontCard = angular.element('.multi-metric-job-container .detector-container .card-front');
    $frontCard.removeClass('card');
    $frontCard.find('.card-title').text('');
  }

  // force job ids to be lowercase
  $scope.changeJobIDCase = function () {
    if ($scope.formConfig.jobId) {
      $scope.formConfig.jobId = $scope.formConfig.jobId.toLowerCase();
    }
  };

  let refreshInterval = REFRESH_INTERVAL_MS;
  // function for creating a new job.
  // creates the job, opens it, creates the datafeed and starts it.
  // the job may fail to open, but the datafeed should still be created
  // if the job save was successful.
  $scope.createJob = function () {
    if ($scope.formConfig.jobId !== ''  && $scope.formConfig.jobId !== undefined) {
      msgs.clear();
      $scope.formConfig.mappingTypes = mlESMappingService.getTypesFromMapping($scope.formConfig.indexPattern.id);
      // create the new job
      mlMultiMetricJobService.createJob($scope.formConfig)
      .then((job) => {
        // if save was successful, open the job
        mlJobService.openJob(job.job_id)
        .then(() => {
          // if open was successful create a new datafeed
          saveNewDatafeed(job, true);
        })
        .catch((resp) => {
          msgs.error('Could not open job: ', resp);
          msgs.error('Job created, creating datafeed anyway');
          // if open failed, still attempt to create the datafeed
          // as it may have failed because we've hit the limit of open jobs
          saveNewDatafeed(job, false);
        });

      })
      .catch((resp) => {
        // save failed
        msgs.error('Save failed: ', resp.resp);
      });
    }

    // save new datafeed internal function
    // creates a new datafeed and attempts to start it depending
    // on startDatafeedAfterSave flag
    function saveNewDatafeed(job, startDatafeedAfterSave) {
      mlJobService.saveNewDatafeed(job.datafeed_config, job.job_id)
      .then(() => {

        if (startDatafeedAfterSave) {
          mlMultiMetricJobService.startDatafeed($scope.formConfig)
          .then(() => {
            $scope.jobState = JOB_STATE.RUNNING;
            refreshCounter = 0;
            refreshInterval = REFRESH_INTERVAL_MS;
            loadCharts();
          })
          .catch((resp) => {
            // datafeed failed
            msgs.error('Could not start datafeed: ', resp);
          });
        }
      })
      .catch((resp) => {
        msgs.error('Save datafeed failed: ', resp);
      });
    }
  };

  function loadCharts() {
    let forceStop = false;
    // the percentage doesn't always reach 100, so periodically check the datafeed status
    // to see if the datafeed has stopped
    const counterLimit = 20 - (refreshInterval / REFRESH_INTERVAL_MS);
    if (refreshCounter >=  counterLimit) {
      refreshCounter = 0;
      mlMultiMetricJobService.checkDatafeedStatus($scope.formConfig)
      .then((status) => {
        if (status === 'stopped') {
          console.log('Stopping poll because datafeed status is: ' + status);
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
      reloadJobSwimlaneData()
      .then(() => {
        reloadDetectorSwimlane()
        .then(() => {
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
          jobCheck();
        });
      });
    }
  }

  function jobCheck() {
    if ($scope.jobState === JOB_STATE.RUNNING || $scope.jobState === JOB_STATE.STOPPING) {
      refreshInterval = adjustRefreshInterval($scope.chartData.loadingDifference, refreshInterval);
      _.delay(loadCharts, refreshInterval);
    } else {
      _.each($scope.chartData.detectors, (chart) => {
        chart.percentComplete = 100;
      });
    }
    if ($scope.chartData.percentComplete > 0) {
      // fade the bar chart once we have results
      toggleSwimlaneVisibility();
    }
    $scope.$broadcast('render-results');
  }

  function reloadJobSwimlaneData() {
    return mlMultiMetricJobService.loadJobSwimlaneData($scope.formConfig);
  }


  function reloadDetectorSwimlane() {
    return mlMultiMetricJobService.loadDetectorSwimlaneData($scope.formConfig);
  }

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
    mlMultiMetricJobService.indexTimeRange(indexPattern)
    .then((resp) => {
      timefilter.time.from = moment(resp.start.epoch).toISOString();
      timefilter.time.to = moment(resp.end.epoch).toISOString();
    });
  };

  $scope.resetJob = function () {
    $scope.jobState = JOB_STATE.NOT_STARTED;
    toggleSwimlaneVisibility();

    window.setTimeout(() => {
      $scope.ui.showJobInput = true;
      $scope.loadVis();
    }, 500);
  };

  function toggleSwimlaneVisibility() {
    if ($scope.jobState === JOB_STATE.NOT_STARTED) {
      angular.element('.swimlane-cells').css('opacity', 0);
      angular.element('.bar').css('opacity', 1);
    } else {
      angular.element('.bar').css('opacity', 0.1);
    }
  }

  $scope.stopJob = function () {
    // setting the status to STOPPING disables the stop button
    $scope.jobState = JOB_STATE.STOPPING;
    mlMultiMetricJobService.stopDatafeed($scope.formConfig);
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
        }).catch(function () {
          // msgs.error("Job results for "+job.job_id+" could not be opened");
        });
    }
  }

  mlESMappingService.getMappings().then(() => {
    initAgg();
    loadFields();

    $scope.loadVis();
  });

  $scope.$listen(timefilter, 'fetch', $scope.loadVis);

});
