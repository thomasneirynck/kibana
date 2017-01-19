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
import angular from 'angular';
import uiRoutes from 'ui/routes';
import 'plugins/ml/lib/bower_components/JSON.minify/minify.json';
// import 'plugins/ml/services/visualization_job_service';
import 'ui/courier';

uiRoutes
.when('/jobs/new_job_advanced', {
  template: require('./new_job.html')
})
.when('/jobs/new_job_advanced/:jobId', {
  template: require('./new_job.html')
});

import stringUtils from 'plugins/ml/util/string_utils';
import jobUtils from 'plugins/ml/util/job_utils';

import uiModules from 'ui/modules';
const module = uiModules.get('apps/ml');

module.controller('MlNewJob',
function (
  $scope,
  $route,
  $location,
  $modal,
  $timeout,
  courier,
  es,
  Private,
  timefilter,
  esServerUrl,
  mlJobService,
  mlMessageBarService,
  mlDatafeedService,
  mlConfirmModalService,
  // mlVisualizationJobService,
  mlTransformsDefaultOutputs) {


  timefilter.enabled = false; // remove time picker from top of page
  const MODE = {
    NEW: 0,
    EDIT: 1,
    CLONE: 2
  };
  // ui model, used to store and control job data that wont be posted to the server.
  const msgs = mlMessageBarService;
  const mlConfirm = mlConfirmModalService;
  msgs.clear();

  $scope.job = {};
  $scope.mode = MODE.NEW;
  $scope.saveLock = false;
  $scope.indexes = {};
  $scope.types = {};
  $scope.properties = {};
  $scope.dateProperties = {};
  $scope.maximumFileSize;
  $scope.mlElasticDataDescriptionExposedFunctions = {};
  $scope.elasticServerInfo = {};

  $scope.ui = {
    pageTitle: 'Create a new job',
    wizard: {
      step:                 1,
      stepHovering:         0,
      CHAR_LIMIT:           500,
      dataLocation:         'ES',
      indexInputType:       'LIST',
      dataPreview:          '',
      dataReady:            false,
      setDataLocation: function (loc) {
        $scope.ui.wizard.dataLocation = loc;
        wizardStep(1);
      },
      forward: function () {
        wizardStep(1);
      },
      back: function () {
        wizardStep(-1);
      },
    },
    currentTab: 0,
    tabs: [
      { index: 0, title: 'Job Details' },
      { index: 1, title: 'Transforms' },
      { index: 2, title: 'Analysis Configuration' },
      { index: 3, title: 'Data Description' },
      { index: 4, title: 'Datafeed' },
      { index: 5, title: 'Edit JSON' },
      { index: 6, title: 'Data Preview', hidden: true },
    ],
    validation: {
      tabs: [
        {index: 0, valid: true, checks: { jobId: {valid: true}}},
        {index: 1, valid: true, checks: {}},
        {index: 2, valid: true, checks: { detectors: {valid: true}, influencers: {valid: true}, categorizationFilters: {valid: true} }},
        {index: 3, valid: true, checks: { timeField: {valid: true}, timeFormat: {valid:true} }},
        {index: 4, valid: true, checks: { isDatafeed:{valid: true}}},
        {index: 5, valid: true, checks: {}},
        {index: 6, valid: true, checks: {}},
      ],
      setTabValid: function (tab, valid) {
        $scope.ui.validation.tabs[tab].valid = valid;
      }
    },
    jsonText: '',
    changeTab: changeTab,
    influencers: [],
    allInfluencers: allInfluencers,
    customInfluencers: [],
    transformInfluencers: [],
    tempCustomInfluencer: '',
    bucketSpanValues: [
      { value: 5,     title: '5 seconds' },
      { value: 10,    title: '10 seconds' },
      { value: 30,    title: '30 seconds' },
      { value: 60,    title: '1 minute' },
      { value: 300,   title: '5 minutes' },
      { value: 600 ,  title: '10 minutes' },
      { value: 1800,  title: '30 minutes' },
      { value: 3600,  title: '1 hour' },
      { value: 14400, title: '4 hours' },
      { value: 28800, title: '8 hours' },
      { value: 43200, title: '12 hours' },
      { value: 86400, title: '1 day' }
    ],
    inputDataFormat:[
      { value: 'DELIMITED',     title: 'Delimited' },
      { value: 'JSON',          title: 'JSON' },
      { value: 'SINGLE_LINE',   title: 'Single Line' },
    ],
    fieldDelimiterOptions:[
      { value: '\t',      title: 'tab'},
      { value: ' ',       title: 'space'},
      { value: ',',       title: ','},
      { value: ';',       title: ';'},
      { value: 'custom',  title: 'custom'}
    ],
    selectedFieldDelimiter: ',',
    customFieldDelimiter: '',
    esServerOk: 0,
    indexTextOk: false,
    indexes: {},
    types: {},
    isDatafeed: false,

    datafeed: {
      queryText:             '{"match_all":{}}',
      queryDelayText:        60,
      frequencyText:         '',
      frequencyDefault:      '',
      scrollSizeText:        '',
      scrollSizeDefault:     1000,
      indexesText:           '',
      typesText:             '',
    },
    saveStatus: {
      job:     0,
    },
    sortByKey: stringUtils.sortByKey,
    hasTransforms: false,
  };

  function init() {
    // load the jobs list for job id validation later on
    mlJobService.loadJobs();

    // check to see whether currentJob is set.
    // if it is, this isn't a new job, it's either a clone or an edit.
    if (mlJobService.currentJob) {
      // try to get the jobId from the url.
      // if it's set, this is a job edit
      const jobId = $route.current.params.jobId;

      // make a copy of the currentJob object. so we don't corrupt the real jobs
      $scope.job = mlJobService.cloneJob(mlJobService.currentJob);
      $scope.job = mlJobService.removeJobCounts($scope.job);

      if (jobId) {
        $scope.mode = MODE.EDIT;
        console.log('Editing job', mlJobService.currentJob);
        $scope.ui.pageTitle = 'Editing Job ' + $scope.job.job_id;
      } else {
        $scope.mode = MODE.CLONE;
        $scope.ui.wizard.step = 2;
        console.log('Cloning job', mlJobService.currentJob);
        $scope.ui.pageTitle = 'Clone Job from ' + $scope.job.job_id;
        $scope.job.job_id = '';
        setDatafeedUIText();
        setTransformsUIText();
        setBucketSpanUIText();
        setFieldDelimiterControlsFromText();

        // if the datafeedConfig doesn't exist, assume we're cloning from a job with no datafeed
        if (!$scope.job.datafeed_config) {
          $scope.ui.wizard.dataLocation = 'NONE';

          // make a list of influencers comprising of the influencers in the job minus
          // the output fields generated by the transforms.
          // assume all remaining influencers are standard influencers
          const outputs = getTransformOutputs();
          $scope.ui.influencers = _.difference($scope.job.analysis_config.influencers, outputs);
          // create the transform influencers
          $scope.addTransformsToProperties();
          // note, when cloning an ES job, the influencers are created once the
          // ES data directive has loaded the server details.
          // cloneJobDataDescriptionCallback() is called once the server details have loaded
        } else {
          delete $scope.job.datafeed_config.datafeed_id;
          delete $scope.job.datafeed_config.job_id;
          delete $scope.job.datafeed_config.status;

          delete $scope.job.data_description.time_format;
          delete $scope.job.data_description.format;
        }
      }

      // clear the current job
      mlJobService.currentJob = undefined;

    } else {
      $scope.mode = MODE.NEW;
      console.log('Creating new job');
      $scope.job = mlJobService.getBlankJob();

      calculateDatafeedFrequencyDefault();
    }
    // showDataPreviewTab();
  }

  function changeTab(tab) {
    $scope.ui.currentTab = tab.index;
    if (tab.index === 5) {
      createJSONText();
    } else if (tab.index === 6) {
      if ($scope.ui.wizard.dataLocation === 'ES') {
        loadDataPreview();
      }
    }
  }

  function wizardStep(step) {
    $scope.ui.wizard.step += step;
    if ($scope.ui.wizard.step === 1) {
      if ($scope.ui.wizard.dataLocation === 'NONE') {
        // no data option was selected. jump to wizard step 2
        $scope.ui.wizard.forward();
        return;
      }
    } else if ($scope.ui.wizard.step === 2) {
      if ($scope.ui.wizard.dataLocation === 'ES') {
        $scope.ui.isDatafeed = true;
        $scope.ui.tabs[3].hidden = true;

        $scope.job.data_description.format = 'JSON';

        delete $scope.job.data_description.time_format;
        delete $scope.job.data_description.format;

        if ($scope.timeFieldSelected()) {
          const time = $scope.job.data_description.time_field;
          if (time && $scope.dateProperties[time]) {
            $scope.job.data_description.time_field = time;
          }
        }
      }
    }

    // showDataPreviewTab();
  }

  $scope.save = function () {
    console.log('save() job: ', $scope.job);
    msgs.clear();
    getDelimiterSelection();
    getDatafeedSelection();

    if (validateJob()) {
      let overwrite = false;
      // if basic validation passes
      // check that the job id doesn't already exist
      // if they want to replace or the job id is fine, move the next step, checkInfluencers.
      const tempJob = mlJobService.getJob($scope.job.job_id);
      if (tempJob) {
        // if the job id exists and that job is currently CLOSED, display a warning
        if (tempJob.status === 'CLOSED') {
          mlConfirm.open({
            message: 'Job \'' + $scope.job.job_id + '\' already exists. <br />Overwriting it will remove all previous results which cannot be undone.<br />Do you wish to continue?',
            title: $scope.job.job_id + ' already exists',
            okLabel: 'Overwrite',
            size: '',
          })
          .then(function () {
            overwrite = true;
            checkInfluencers();
          })
          .catch(function () {
            displayJobIdError();
          });
        } else {
          // if the job is not CLOSED, stop the save altogether and display a message
          mlConfirm.open({
            message: 'Only jobs which are CLOSED can be overwritten.<br />Please choose a different name or close the job',
            title: 'Job \'' + $scope.job.job_id +  '\' already exists and is ' + tempJob.status,
            okLabel: 'OK',
            hideCancel: true,
            size: '',
          }).then(function () {
            displayJobIdError();
          });
        }
      } else {
        checkInfluencers();
      }

      // flag up the error on the first tab about the job id already existing
      function displayJobIdError() {
        const tab = $scope.ui.validation.tabs[0];
        tab.valid = false;
        tab.checks.jobId.valid = false;
        tab.checks.jobId.message = '\'' + $scope.job.job_id + '\' already exists, please choose a different name';
        changeTab({index:0});
      }

      function checkInfluencers() {
        // check that they have chosen some influencers
        if ($scope.job.analysis_config.influencers &&
           $scope.job.analysis_config.influencers.length) {
          saveFunc();
        } else {
          // if there are no influencers set, open a confirmation
          mlConfirm.open({
            message: 'You have not chosen any influencers, do you want to continue?',
            title: 'No Influencers'
          }).then(saveFunc)
            .catch(function () {
              changeTab({index:2});
            });
        }
      }

      function createJobForSaving(job) {
        const newJob = angular.copy(job);
        delete newJob.datafeed_config;
        return newJob;
      }

      function saveFunc() {
        $scope.saveLock = true;
        $scope.ui.saveStatus.job = 1;
        openSaveStatusWindow();

        const job = createJobForSaving($scope.job);

        mlJobService.saveNewJob(job, overwrite)
          .then((result) => {
            if (result.success) {
              // After the job has been successfully created the Elasticsearch
              // mappings should be fully set up, but the Kibana mappings then
              // need to be refreshed to reflect the Elasticsearch mappings
              courier.indexPatterns.get('.ml-anomalies-*')
              .then((indexPattern) => {
                indexPattern.refreshFields()
                .then(() => {
                  console.log('refreshed fields for index pattern .ml-anomalies-*');

                  // wait for mappings refresh before continuing on with the post save stuff
                  msgs.info('New Job \'' + result.resp.job_id + '\' added');
                  // update status
                  $scope.ui.saveStatus.job = 2;

                  // save successful, attempt to open the job
                  mlJobService.openJob($scope.job.job_id)
                  .then((resp) => {
                    if ($scope.job.datafeed_config) {
                      // open job successful, create a new datafeed
                      mlJobService.saveNewDatafeed($scope.job.datafeed_config, $scope.job.job_id)
                      .then(resp => {
                        $scope.saveLock = false;
                      })
                      .catch((resp) => {
                        msgs.error('Could not start datafeed: ', resp);
                        $scope.saveLock = false;
                      });
                    } else {
                      // no datafeed, so save is complete
                      $scope.saveLock = false;
                    }
                  })
                  .catch((resp) => {
                    msgs.error('Could not open job: ', resp);
                    msgs.error('Job created, creating datafeed anyway');
                    $scope.saveLock = false;
                  });
                });
              });
            } else {
              // save failed, unlock the buttons and tell the user
              $scope.ui.saveStatus.job = -1;
              $scope.saveLock = false;
              msgs.error('Save failed: ' + result.resp.message);
            }
          }).catch((result) => {
            $scope.ui.saveStatus.job = -1;
            $scope.saveLock = false;
            msgs.error('Save failed: ' + result.resp.message);
          });
      }

    }
    else {
      msgs.error('Fill in all required fields');
      console.log('save(): job validation failed');
    }
  };

  $scope.cancel = function () {
    mlConfirm.open({
      message:'Are you sure you want to cancel job creation?',
      title: 'Are you sure?'
    })
      .then(() => {
        msgs.clear();
        $location.path('jobs');
      });
  };

  // called after loading ES data when cloning a job
  $scope.cloneJobDataDescriptionCallback = function () {
    extractCustomInfluencers();
    $scope.addTransformsToProperties();
  };

  $scope.indexSelected = function () {
    if ($scope.ui.wizard.indexInputType === 'TEXT') {
      // if the user is entering index text manually, check that the text isn't blank
      // and a match to an index has been made resulting in some fields.
      return ($scope.ui.datafeed.indexesText.length && Object.keys($scope.properties).length) ? true : false;
    } else {
      return Object.keys($scope.indexes).length ? true : false;
    }
  };

  $scope.timeFieldSelected = function () {
    return ($scope.job.data_description.time_field === '') ? false : true;
  };

  $scope.jsonTextChange = function () {
    try {
      // the json text may contain comments which are illegal in json and so causes problems
      // for the parser, minifying first strips these out
      const minfiedJson = JSON.minify($scope.ui.jsonText);
      // create the job from the json text.
      $scope.job = JSON.parse(minfiedJson);
      $scope.changeJobIDCase();

      // in case influencers have been added into the json. treat them as custom if unrecognised
      extractCustomInfluencers();

      setFieldDelimiterControlsFromText();
      setDatafeedUIText();
      setBucketSpanUIText();
    } catch (e) {
      console.log('JSON could not be parsed');
      // a better warning should be used.
      // colour the json text area red and display a warning somewhere. possibly in the message bar.
    }
  };

  // force job ids to be lowercase
  $scope.changeJobIDCase = function () {
    if ($scope.job.job_id) {
      $scope.job.job_id = $scope.job.job_id.toLowerCase();
    }
  };

  // called when the datafeed tickbox is toggled.
  // creates or destroys the datafeed section in the config
  $scope.datafeedChange = function () {
    if ($scope.ui.isDatafeed) {
      $scope.job.datafeed_config = {};
      $scope.ui.tabs[3].hidden = true;
      calculateDatafeedFrequencyDefault();
    } else {
      delete $scope.job.datafeed_config;
      $scope.ui.tabs[3].hidden = false;
      $scope.job.data_description.format = 'JSON';
    }

    // showDataPreviewTab();
  };

  // called when the transforms tickbox is toggled.
  // creates or destroys the transforms section in the config
  $scope.hasTransformChange = function () {
    if ($scope.ui.hasTransforms) {
      $scope.job.transforms = [];
    } else {
      delete $scope.job.transforms;
    }
  };

  // general function to remove an analysisConfig property from the config if it's an empty string
  $scope.generalAnalysisConfigFieldNameChange = function (name) {
    if ($scope.job.analysis_config[name].trim() === '') {
      delete $scope.job.analysis_config[name];
    }
  };

  function clear(obj) {
    Object.keys(obj).forEach(function (key) { delete obj[key]; });
    if (Array.isArray(obj)) {
      obj.length = 0;
    }
  }

  // triggered when the user changes the JSON text
  // reflect the changes in the UI
  function setDatafeedUIText() {
    if ($scope.job.datafeed_config) {
      const datafeedConfig = $scope.job.datafeed_config;

      $scope.ui.isDatafeed = true;
      $scope.ui.tabs[3].hidden = true;
      $scope.ui.wizard.dataLocation = 'ES';
      // showDataPreviewTab();

      const frequencyDefault = $scope.ui.datafeed.frequencyDefault;
      let freq = datafeedConfig.frequency;
      if ($scope.ui.datafeed.frequencyDefault === datafeedConfig.frequency) {
        freq = '';
      }

      const scrollSizeDefault = $scope.ui.datafeed.scrollSizeDefault;
      let scrollSize = datafeedConfig.scroll_size;
      if ($scope.ui.datafeed.scrollSizeDefault === datafeedConfig.scroll_size) {
        scrollSize = '';
      }


      clear($scope.types);
      _.each(datafeedConfig.types, function (type) {
        $scope.types[type] = $scope.ui.types[type];
      });

      clear($scope.indexes);
      _.each(datafeedConfig.indexes, function (index) {
        $scope.indexes[index] = $scope.ui.indexes[index];
      });

      $scope.ui.datafeed = {
        queryText:         angular.toJson(datafeedConfig.query, true),
        queryDelayText:    +datafeedConfig.query_delay,
        frequencyText:     freq,
        frequencyDefault:  frequencyDefault,
        scrollSizeText:    scrollSize,
        scrollSizeDefault: scrollSizeDefault,
        indexesText:       datafeedConfig.indexes.join(','),
        typesText:         datafeedConfig.types.join(','),
      };

      // load the mappings from the configured server
      // via the functions exposed in the elastic data controller
      if (typeof $scope.mlElasticDataDescriptionExposedFunctions.extractFields === 'function') {
        $scope.mlElasticDataDescriptionExposedFunctions.getMappings().then(() => {
          $scope.mlElasticDataDescriptionExposedFunctions.extractFields({types: $scope.types});
        });
      }

    } else {
      $scope.ui.isDatafeed = false;
      $scope.ui.tabs[3].hidden = false;
    }
  }

  // check the transforms checkbox if the transforms section is found in the job config
  function setTransformsUIText() {
    if ($scope.job.transforms && $scope.job.transforms.length) {
      $scope.ui.hasTransforms = true;
    }
  }

  // function to manage the rare situation that a user
  // enters their own bucket_span value in the JSON.
  // i.e, one that's not in the select's list ($scope.ui.bucketSpanValues)
  function setBucketSpanUIText() {
    const bs = $scope.job.analysis_config.bucket_span;
    const bvs = $scope.ui.bucketSpanValues;

    // remove any previosuly added custom entries first
    for (let i = bvs.length - 1; i >= 0; i--) {
      if (bvs[i].custom) {
        bvs.splice(i, 1);
      }
    }

    const found = _.findWhere(bvs, {value: bs});
    // if the bucket_span isn't in the list, add it to the end
    if (!found) {
      bvs.push({
        value:  bs,
        title:  bs + ' seconds',
        custom: true
      });
    }
  }

  // work out the default frequency based on the bucket_span
  function calculateDatafeedFrequencyDefault() {
    $scope.ui.datafeed.frequencyDefault = jobUtils.calculateDatafeedFrequencyDefault($scope.job.analysis_config.bucket_span);
  }

  // scope version of the above function
  $scope.calculateDatafeedFrequencyDefault = calculateDatafeedFrequencyDefault;


  function setFieldDelimiterControlsFromText() {
    if ($scope.job.data_description && $scope.job.data_description.field_delimiter) {

      // if the data format has not been set and fieldDelimiter exists,
      // assume the format is DELIMITED
      if ($scope.job.data_description.format === undefined) {
        $scope.job.data_description.format = 'DELIMITED';
      }

      const fieldDelimiter = $scope.job.data_description.field_delimiter;
      $scope.ui.selectedFieldDelimiter = 'custom';
      $scope.ui.customFieldDelimiter = '';
      let isCustom = true;
      for (let i = 0; i < $scope.ui.fieldDelimiterOptions.length - 1; i++) {
        if ($scope.ui.fieldDelimiterOptions[i].value === fieldDelimiter) {
          isCustom = false;
          $scope.ui.selectedFieldDelimiter = $scope.ui.fieldDelimiterOptions[i].value;
        }
      }
      if (isCustom) {
        $scope.ui.customFieldDelimiter = fieldDelimiter;
      }
    }
  }

  function getDelimiterSelection() {
    if ($scope.job.data_description.format === 'DELIMITED') {
      const selectedFieldDelimiter = $scope.ui.selectedFieldDelimiter;
      if (selectedFieldDelimiter === 'custom') {
        $scope.job.data_description.field_delimiter = $scope.ui.customFieldDelimiter;
      }
      else {
        $scope.job.data_description.field_delimiter = selectedFieldDelimiter;
      }
    } else {
      delete $scope.job.data_description.field_delimiter;
      delete $scope.job.data_description.quote_character;
    }
  }

  // create the datafeedConfig section of the job config
  function getDatafeedSelection() {
    if ($scope.ui.isDatafeed) {
      const df = $scope.ui.datafeed;

      if (df.queryDelayText === '') {
        df.queryDelayText = 60;
      }

      if (df.queryText === '') {
        df.queryText = '{"match_all":{}}';
      }
      let query = df.queryText;
      try {
        query = JSON.parse(query);
      } catch (e) {
        console.log('getDatafeedSelection(): could not parse query JSON');
      }

      let indexes = [];
      if (df.indexesText) {
        indexes = df.indexesText.split(',');
        for (let i = 0; i < indexes.length; i++) {
          indexes[i] = indexes[i].trim();
        }
      }

      let types = [];
      if (df.typesText) {
        types = df.typesText.split(',');
        for (let i = 0; i < types.length; i++) {
          types[i] = types[i].trim();
        }
      }

      // create datafeedConfig if it doesn't already exist
      if (!$scope.job.datafeed_config) {
        $scope.job.datafeed_config = {};
      }

      const config = $scope.job.datafeed_config;

      config.query =       query;
      config.query_delay = df.queryDelayText;
      config.frequency =   ((df.frequencyText === '' || df.frequencyText === null || df.frequencyText === undefined) ? df.frequencyDefault : df.frequencyText);
      config.scroll_size = ((df.scrollSizeText === '' || df.scrollSizeText === null || df.scrollSizeText === undefined) ? df.scrollSizeDefault : df.scrollSizeText);
      config.indexes =     indexes;
      config.types =       types;
    }
  }

  function getCustomUrlSelection() {
    // if no custom urls have been created, delete the whole custom settings item
    if ($scope.job.custom_settings && $scope.job.custom_settings.custom_urls) {
      if ($scope.job.custom_settings.custom_urls.length === 0) {
        delete $scope.job.custom_settings;
      }
    }
  }

  function getCategorizationFilterSelection() {
    // if no filters have been created, delete the filter array
    if ($scope.job.analysis_config && $scope.job.analysis_config.categorization_filters) {
      if ($scope.job.analysis_config.categorization_filters.length === 0) {
        delete $scope.job.analysis_config.categorization_filters;
      }
    }
  }

  function createJSONText() {
    getDelimiterSelection();
    getDatafeedSelection();
    getCustomUrlSelection();
    getCategorizationFilterSelection();
    $scope.ui.jsonText = angular.toJson($scope.job, true);
  }

  // add new custom URL
  $scope.addCustomUrl = function () {
    if (!$scope.job.custom_settings) {
      $scope.job.custom_settings = {};
    }
    if (!$scope.job.custom_settings.custom_urls) {
      $scope.job.custom_settings.custom_urls = [];
    }

    $scope.job.custom_settings.custom_urls.push({ urlName: '', urlValue: '' });
  };

  // remove selected custom URL
  $scope.removeCustomUrl = function (index) {
    $scope.job.custom_settings.custom_urls.splice(index, 1);
  };

  // add new categorization filter
  $scope.addCategorizationFilter = function () {
    if ($scope.job.analysis_config) {
      if (!$scope.job.analysis_config.categorization_filters) {
        $scope.job.analysis_config.categorization_filters = [];
      }

      $scope.job.analysis_config.categorization_filters.push('');
    }
  };

  // remove selected categorization filter
  $scope.removeCategorizationFilter = function (index) {
    if ($scope.job.analysis_config && $scope.job.analysis_config.categorization_filters) {
      $scope.job.analysis_config.categorization_filters.splice(index, 1);
    }
  };


  $scope.influencerChecked = function (inf) {
    return (_.contains($scope.job.analysis_config.influencers, inf));
  };

  $scope.toggleInfluencer = function (inf) {
    const influencers = $scope.job.analysis_config.influencers;
    if ($scope.influencerChecked(inf)) {
      for (let i = 0; i < influencers.length; i++) {
        if (influencers[i] === inf) {
          $scope.job.analysis_config.influencers.splice(i, 1);
        }
      }
    } else {
      $scope.job.analysis_config.influencers.push(inf);
    }
  };

  $scope.addCustomInfluencer = function () {
    if ($scope.ui.tempCustomInfluencer !== '') {
      $scope.ui.customInfluencers.push($scope.ui.tempCustomInfluencer);
      $scope.ui.tempCustomInfluencer = '';
    }
  };

  // look at the difference between loaded ES influencers and the ones in the current job.
  // unrecognised influencers must have been added by the user.
  function extractCustomInfluencers() {
    const allInfluencers = $scope.ui.influencers.concat($scope.ui.transformInfluencers);
    $scope.ui.customInfluencers = _.difference($scope.job.analysis_config.influencers, allInfluencers, getTransformOutputs());
    console.log('extractCustomInfluencers: ', $scope.ui.customInfluencers);
  }

  // get an array of outputs from the configured transforms
  function getTransformOutputs() {
    let allOutputs = [];
    _.each($scope.job.transforms, function (trfm) {
      let outputs = trfm.outputs;
      const DEFAULT_OUTPUTS = mlTransformsDefaultOutputs;

      // no outputs, use defaults for the transform
      if (outputs === undefined) {
        outputs = DEFAULT_OUTPUTS[trfm.transform];
      }

      // some transforms don't have outputs, so don't add them
      if (outputs !== undefined) {
        allOutputs = allOutputs.concat(outputs);
      }
    });
    return allOutputs;
  }

  $scope.addTransformsToProperties = function () {
    // clear existing transform based properties
    _.each($scope.properties, function (prop, i) {
      if (prop.transform) {
        delete $scope.properties[i];
      }
    });

    const outputs = getTransformOutputs();
    // add the outputs to the properties object
    _.each(outputs, function (op) {
      if (!$scope.properties[op]) {
        $scope.properties[op] = {type: 'date', transform: true};
      }
    });

    // refresh the list of transform influencers
    $scope.ui.transformInfluencers = outputs;

    // remove checked influencers which now no longer exist in standard, custom or transform influencer lists.
    const allInfluencers = $scope.ui.influencers.concat($scope.ui.customInfluencers, $scope.ui.transformInfluencers);
    const checkedInfuencers = $scope.job.analysis_config.influencers;
    for (let i = checkedInfuencers.length - 1; i >= 0; i--) {
      if (_.indexOf(allInfluencers, checkedInfuencers[i]) === -1) {
        checkedInfuencers.splice(i, 1);
      }
    }
  };

  // function used to check that all required fields are filled in
  function validateJob() {
    let valid = true;

    const tabs = $scope.ui.validation.tabs;
    // reset validations
    _.each(tabs, function (tab) {
      tab.valid = true;
      for (const check in tab.checks) {
        if (Object.prototype.hasOwnProperty(tab.checks, check)) {
          tab.checks[check].valid = true;
          tab.checks[check].message = '';
        }
      }
    });

    const job = $scope.job;
    if (job) {
      // tab 0 - Job Details
      // job already exists check happens in save function
      // as users may wish to continue and overwrite existing job
      if (_.isEmpty(job.job_id)) {
        tabs[0].checks.jobId.valid = false;
      } else if (!job.job_id.match(/^[a-z0-9\-\_]{1,64}$/g)) {
        tabs[0].checks.jobId.valid = false;
        tabs[0].checks.jobId.message = 'Job name must be a lowercase alphanumeric word no greater than 64 characters long. It may contain hyphens or underscores.';
      }

      // tab 2 - Analysis Configuration
      if (job.analysis_config.categorization_filters) {
        let v = true;
        _.each(job.analysis_config.categorization_filters, function (d) {
          try {
            new RegExp(d);
          } catch (e) {
            v = false;
          }

          if (job.analysis_config.categorization_field_name === undefined || job.analysis_config.categorization_field_name === '') {
            tabs[2].checks.categorization_filters.message = 'categorizationFieldName must be set to allow filters';
            v = false;
          }

          if (d === '' || v === false) {
            tabs[2].checks.categorization_filters.valid = false;
            valid = false;
          }
        });
      }


      if (job.analysis_config.detectors.length === 0) {
        tabs[2].checks.detectors.valid = false;
      } else {
        _.each(job.analysis_config.detectors, function (d) {
          if (_.isEmpty(d.function)) {
            valid = false;
          }
        });
      }

      if (job.analysis_config.influencers &&
         job.analysis_config.influencers.length === 0) {
        // tabs[2].checks.influencers.valid = false;
      }

      // tab 3 - Data Description
      if (_.isEmpty(job.data_description.time_field)) {
        tabs[3].checks.timeField.valid = false;
      }

    } else {
      valid = false;
    }

    // for each tab, set its validity based on its contained checks
    _.each(tabs, function (tab) {
      _.each(tab.checks, function (item) {
        if (item.valid === false) {
          // set tab valid state to false
          tab.valid = false;
          // set overall valid state to false
          valid = false;
        }
      });
    });

    return valid;
  }

  function openSaveStatusWindow() {
    $modal.open({
      template: require('plugins/ml/jobs/components/new_job_advanced/save_status_modal/save_status_modal.html'),
      controller: 'MlSaveStatusModal',
      backdrop: 'static',
      keyboard: false,
      size: 'sm',
      resolve: {
        params: function () {
          return {
            pscope:           $scope,
            openDatafeed:    function () {
              mlDatafeedService.openJobTimepickerWindow($scope.job);
            }
          };
        }
      }
    });
  }

  // using the selected indexes and types, perform a search
  // on the ES server and display the results in the Data preview tab
  function loadDataPreview() {
    createJSONText();
    $scope.ui.wizard.dataPreview = '';

    const indexes = Object.keys($scope.indexes);
    const types = Object.keys($scope.types);
    const job = $scope.job;
    if (indexes.length) {
      mlJobService.searchPreview(indexes, types, job)
      .then(function (resp) {
        $scope.ui.wizard.dataPreview = angular.toJson(resp, true);
      })
      .catch(function (resp) {
        $scope.ui.wizard.dataPreview = angular.toJson(resp, true);
      });
    }
  }

  function showDataPreviewTab() {
    let hidden = true;
    // if this is a datafeed job, make the Data Preview tab available
    if ($scope.ui.isDatafeed) {
      hidden = false;
    }

    // however, if cloning a datafeedless, don't display the preview tab
    if ($scope.ui.wizard.dataLocation === 'NONE' && $scope.mode === MODE.CLONE) {
      hidden = true;
    }

    $scope.ui.tabs[6].hidden = hidden;
    $scope.$applyAsync();
  }

  // combine all influencers into a sorted array
  function allInfluencers() {
    let influencers = $scope.ui.influencers.concat($scope.ui.transformInfluencers, $scope.ui.customInfluencers);
    // deduplicate to play well with ng-repeat
    influencers = _.uniq(influencers);

    return _.sortBy(influencers, function (inf) {return inf;});
  }

  init();


  // $scope.getJobFromVisId = function (id) {
  //   mlVisualizationJobService.getJobFromVisId($scope.job, id)
  //   .then(() => {
  //     setDatafeedUIText();
  //   });

  // };

})
// custom filter to filter transforms from the properties datalist
// used only for the summaryCountFieldName field datalist
.filter('filterTransforms', function () {
  return function (input) {
    const tempObj = {};
    _.each(input, function (v,i) {
      if (!v.transform) {
        tempObj[i] = v;
      }
    });
    return tempObj;
  };
});
